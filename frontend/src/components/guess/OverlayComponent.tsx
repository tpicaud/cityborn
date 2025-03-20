import Guess from "@/types/Guess";
import { Box, Button } from "@mui/material";
import GuessObjectComponent from "./GuessObjectComponent";
import CountdownComponent from "./CountdownComponent";
import Round from "@/types/Round";
import { RoundStatus } from "@/enums/RoundStatus";
import Game from "@/types/Game";
import { useEffect, useState } from "react";

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
    currentRound,
    localPlayerID
}: {
    currentRound: Round,
    localPlayerID: string
}) {
    return (currentRound.playersGuesses && currentRound.status === RoundStatus.SHOWING_RESULTS) && (
        <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
            {/* Box for points */}
            <Box className="p-2 text-xl md:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm w-36">
                <p><b>{currentRound.playersGuesses[localPlayerID].points}</b> pts</p>
            </Box>
            <Box className="p-2 text-xs md:text-base text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full" >
                <p><b>{currentRound.guessObject.name}</b> est né à <b>{currentRound.guessObject.answer.place_name}</b></p>
                {currentRound.playersGuesses[localPlayerID].distance !== -1 ? (
                    currentRound.playersGuesses[localPlayerID].distance === 0 ? (
                        <p><b>Bien joué ! Tu as deviné !</b></p>
                    ) : (
                        <p>Tu es à <b>{currentRound.playersGuesses[localPlayerID].distance.toFixed(2)}</b> km</p>
                    )
                ) : (
                    <p><b>Tu n'as pas deviné à temps !</b></p>
                )}
            </Box>
        </div>
    )
}



interface OverlayComponentProps {
    localPlayerID: string
    preGuess: Guess | undefined;
    game: Game,
    handleGuess: (value: Guess) => void;
    handleIsTimeUp: () => void;
    handleNextRound: () => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    localPlayerID,
    preGuess,
    game,
    handleGuess,
    handleIsTimeUp,
}) => {

    const [timerEnded, setTimerEnded] = useState(false);

    useEffect(() => {
        setTimerEnded(false)
    }, [game.currentRound?.guessObject.name])

    useEffect(() => {
        if (timerEnded) {
            handleIsTimeUp()
        }
    }, [timerEnded])

    return (
        <div>
            <GuessObjectComponent guessObject={game.currentRound!.guessObject} />
            <div className="absolute w-[30%] min-w-36 m-4">
                {(game.currentRound!.status === RoundStatus.GUESSING) && (
                    <CountdownComponent totalTime={20} endMessage="Terminé !" setTimerEnded={setTimerEnded} />
                )}
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                <GuessResult currentRound={game.currentRound!} localPlayerID={localPlayerID} />
                <div className="relative w-full flex justify-center items-center">
                    <GuessButton
                        preGuess={preGuess}
                        disabled={
                            (game.currentRound!.status !== RoundStatus.GUESSING) || (game.currentRound?.playersGuesses?.[localPlayerID] !== undefined)
                        }
                        handleGuess={handleGuess} />
                </div>
            </div>
        </div>
    );
}

export default OverlayComponent;