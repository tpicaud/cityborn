import Guess from "@/types/Guess";
import { Box, Button } from "@mui/material";
import GuessObjectComponent from "./GuessObjectComponent";
import CountdownComponent from "./CountdownComponent";
import { Result } from "@/types/Results";
import Round from "@/types/Round";
import { RoundStatus } from "@/enums/RoundStatus";
import Game from "@/types/Game";

function GuessButton({
    preGuess,
    disabled,
    handleGuess,
}: {
    preGuess: OverlayComponentProps['preGuess'];
    disabled: boolean;
    handleGuess: OverlayComponentProps['handleGuess'];
}) {
    return (
        <Button
            variant="contained"
            onClick={() => preGuess && handleGuess(preGuess)}
            disabled={disabled}
            sx={{
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
                py: 1,
                px: 2,
                width: '50%',
                textAlign: 'center',
            }}
        >
            Guess
        </Button>
    );
}


function GuessResult({
    preGuess,
    currentRound
}: {
    preGuess: Guess | undefined
    currentRound: Round
}) {
    return (preGuess && currentRound.status === RoundStatus.SHOWING_RESULTS) && (
        <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
            {/* Box for points */}
            <Box className="p-2 text-xl md:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm w-36">
                <p><b>{preGuess.points}</b> pts</p>
            </Box>
            <Box className="p-2 text-xs md:text-base text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full" >
                <p><b>{currentRound.guessObject.name}</b> est né à <b>{currentRound.guessObject.answer.place_name}</b></p>
                {preGuess.distance !== -1 ? (
                    preGuess.distance === 0 ? (
                        <p><b>Bien joué ! Tu as deviné !</b></p>
                    ) : (
                        <p>Tu es à <b>{preGuess.distance.toFixed(2)}</b> km</p>
                    )
                ) : (
                    <p><b>Tu n'as pas deviné à temps !</b></p>
                )}
            </Box>
        </div>
    )
}



interface OverlayComponentProps {
    preGuess: Guess | undefined;
    game: Game,
    handleGuess: (value: Guess) => void;
    handleIsTimeUp: () => void;
    handleNextRound: () => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    preGuess,
    game,
    handleGuess,
    handleIsTimeUp,
}) => {
    return (
        <div>
            <GuessObjectComponent guessObject={game.currentRound!.guessObject} />
            <div className="absolute w-[30%] min-w-36 m-4">
                {(game.currentRound!.status === RoundStatus.GUESSING) && (
                    <CountdownComponent totalTime={20} endMessage="Terminé !" handleIsTimeUp={handleIsTimeUp} />
                )}
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                <GuessResult currentRound={game.currentRound!} preGuess={preGuess} />
                <div className="relative w-full flex justify-center items-center">
                    <GuessButton preGuess={preGuess} disabled={game.currentRound!.status !== RoundStatus.GUESSING || !preGuess} handleGuess={handleGuess} />
                </div>
            </div>
        </div>
    );
}

export default OverlayComponent;