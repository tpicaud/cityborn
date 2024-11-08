import Guess from "@/types/Guess";
import GuessObject from "@/types/GuessObject";
import { ArrowForward } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import GuessObjectComponent from "../GuessObjectComponent";

function GuessButton({
    preGuess,
    guess,
    handleGuess,
}: {
    preGuess: OverlayComponentProps['preGuess'],
    guess: OverlayComponentProps['guess'],
    handleGuess: OverlayComponentProps['handleGuess'],
}) {
    const isDisabled = !Boolean(preGuess) || Boolean(guess);
    return (
        <Button
            variant="contained"
            onClick={() => preGuess && handleGuess(preGuess)}
            disabled={isDisabled}
            className='text-white font-bold rounded py-2 px-4 w-[50%] block text-center'
        >
            Guess
        </Button>
    )
}

function GuessResult({
    guess,
}: {
    guess: OverlayComponentProps['guess'],
}) {
    return guess && (
        <Box className="mb-4 p-2 text-center bg-blue-200 text-blue-600 rounded shadow-sm mx-auto" >
            You are at <b>{guess.distance.toFixed(2)} km</b>
        </Box>
    )
}

// Convert NextButton to a functional component that accepts props
const NextButton: React.FC<{
    handleNextGuessObject: OverlayComponentProps['handleNextGuessObject'];
}> = ({ handleNextGuessObject }) => {
    return (
        <Button
            variant='contained'
            color='error'
            onClick={handleNextGuessObject}
            sx={{
                borderRadius: '20px',
            }}
            className="text-white font-bold"
        >
            <ArrowForward />
        </Button>
    )
}


interface OverlayComponentProps {
    preGuess: Guess | undefined;
    guess: Guess | undefined;
    guessObject: GuessObject;
    handleGuess: (value: Guess) => void;
    handleNextGuessObject: () => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    preGuess,
    guess,
    guessObject,
    handleGuess,
    handleNextGuessObject,
}) => {
    return (
        <div>
            <GuessObjectComponent guessObject={guessObject} />
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                <GuessResult guess={guess} />
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