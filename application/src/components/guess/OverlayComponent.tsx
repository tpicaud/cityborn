import Guess from "@/types/Guess";
import { ArrowForward } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import GuessObjectComponent from "./GuessObjectComponent";
import CountdownComponent from "./CountdownComponent";
import { Result } from "@/types/Results";
import Round from "@/types/Round";
import { RoundStatus } from "@/enums/RoundStatus";

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
    currentRound
}: {
    currentRound: Round
}) {
    return (currentRound.localPlayerGuess && currentRound.status === RoundStatus.SHOWING_RESULTS) && (
        <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
            {/* Box for points */}
            <Box className="p-2 text-xl md:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm w-36">
                <p><b>{currentRound.localPlayerGuess.points}</b> pts</p>
            </Box>
            <Box className="p-2 text-xs md:text-base text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full" >
                <p><b>{currentRound.guessObject.name}</b> est né à <b>{currentRound.guessObject.answer.place_name}</b></p>
                {currentRound.localPlayerGuess.distance !== -1 ? (
                    currentRound.localPlayerGuess.distance === 0 ? (
                        <p><b>Bien joué ! Tu as deviné !</b></p>
                    ) : (
                        <p>Tu es à <b>{currentRound.localPlayerGuess.distance.toFixed(2)}</b> km</p>
                    )
                ) : (
                    <p><b>Tu n'as pas deviné à temps !</b></p>
                )}
            </Box>
        </div>
    )
}

// Convert NextButton to a functional component that accepts props
const NextButton: React.FC<{
    handleNextRound: OverlayComponentProps['handleNextRound'];
    recordResult: OverlayComponentProps['recordResult']
    currentRound: Round
}> = ({ handleNextRound, recordResult, currentRound }) => {
    const result: Result = {
        guessObject: currentRound.guessObject,
        distance: currentRound.localPlayerGuess!.distance,
        points: currentRound.localPlayerGuess!.points
    }
    return (
        <Button
            variant="contained"
            color="error"
            onClick={() => {
                handleNextRound;
                recordResult(result)
            }}
            sx={{
                borderRadius: 6,
                color: 'white',
                fontWeight: 'bold',
                minWidth: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <ArrowForward />
        </Button>
    );
};



interface OverlayComponentProps {
    preGuess: Guess | undefined;
    currentRound: Round
    handleGuess: (value: Guess) => void;
    handleIsTimeUp: () => void;
    handleNextRound: () => void;
    recordResult: (result: Result) => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    preGuess,
    currentRound,
    handleGuess,
    handleIsTimeUp,
    handleNextRound,
    recordResult
}) => {
    return (
        <div>
            <GuessObjectComponent guessObject={currentRound.guessObject} />
            <div className="absolute w-[30%] min-w-36 m-4">
                {(currentRound.status === RoundStatus.GUESSING) && (
                    <CountdownComponent totalTime={20} endMessage="Time's up!" handleIsTimeUp={handleIsTimeUp} />
                )}
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                <GuessResult currentRound={currentRound} />
                <div className="relative w-full flex justify-center items-center">
                    <GuessButton preGuess={preGuess} disabled={currentRound.status !== RoundStatus.GUESSING} handleGuess={handleGuess} />
                    {(currentRound.status === RoundStatus.SHOWING_RESULTS) && (
                        <div className='absolute right-0'>
                            <NextButton handleNextRound={handleNextRound} recordResult={recordResult} currentRound={currentRound} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OverlayComponent;