import Guess from "@/types/Guess";
import GuessObject from "@/types/GuessObject";
import { ArrowForward } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import GuessObjectComponent from "./GuessObjectComponent";
import CountdownComponent from "./CountdownComponent";

function GuessButton({
    preGuess,
    guess,
    handleGuess,
}: {
    preGuess: OverlayComponentProps['preGuess'];
    guess: OverlayComponentProps['guess'];
    handleGuess: OverlayComponentProps['handleGuess'];
}) {
    const isDisabled = !Boolean(preGuess) || Boolean(guess);
    return (
        <Button
            variant="contained"
            onClick={() => preGuess && handleGuess(preGuess)}
            disabled={isDisabled}
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
    guess,
    guessObject,
}: {
    guess: OverlayComponentProps['guess'],
    guessObject: OverlayComponentProps['guessObject'],
}) {
    return guess && (
        <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
            {/* Box for points */}
            <Box className="p-2 text-xl md:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm w-36">
                <p><b>{guess.points}</b> pts</p>
            </Box>
            <Box className="p-2 text-xs md:text-base text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full" >
                <p><b>{guessObject.name}</b> est né à <b>{guessObject.city}</b></p>
                {guess.distance !== -1 ? (
                    <p>Tu es à <b>{guess.distance.toFixed(2)}</b> km</p>
                ) : (
                    <p><b>Tu n'as pas deviné à temps !</b></p>
                )}
            </Box>
        </div>
    )
}

// Convert NextButton to a functional component that accepts props
const NextButton: React.FC<{
    handleNextGuessObject: OverlayComponentProps['handleNextGuessObject'];
}> = ({ handleNextGuessObject }) => {
    return (
        <Button
            variant="contained"
            color="error"
            onClick={handleNextGuessObject}
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
    guess: Guess | undefined;
    guessObject: GuessObject;
    handleGuess: (value: Guess) => void;
    handleIsTimeUp: () => void;
    handleNextGuessObject: () => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    preGuess,
    guess,
    guessObject,
    handleGuess,
    handleIsTimeUp,
    handleNextGuessObject,
}) => {
    return (
        <div>
            <GuessObjectComponent guessObject={guessObject} />
            <div className="absolute w-[30%] min-w-36 m-4">
                {!guess && (
                    <CountdownComponent totalTime={20} endMessage="Time's up!" handleIsTimeUp={handleIsTimeUp} />
                )}
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                <GuessResult guess={guess} guessObject={guessObject} />
                <div className="relative w-full flex justify-center items-center">
                    <GuessButton preGuess={preGuess} guess={guess} handleGuess={handleGuess} />
                    {guess && (
                        <div className='absolute right-0'>
                            <NextButton handleNextGuessObject={handleNextGuessObject} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OverlayComponent;