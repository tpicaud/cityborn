import Coord from "@/types/Coord";
import { ArrowForward } from "@mui/icons-material";
import { Box, Button } from "@mui/material";


function GuessButton({
    preGuess,
    guess,
    handleGuess
}: {
    preGuess: OverlayComponentProps['preGuess'],
    guess: OverlayComponentProps['guess'],
    handleGuess: OverlayComponentProps['handleGuess']
}) {

    const isDisabled = !Boolean(preGuess) || Boolean(guess);
    return (
        <Button
            variant="contained"
            onClick={handleGuess(preGuess)}
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
        <Box
            className="mb-4 p-2 text-center bg-blue-200 text-blue-600 rounded shadow-sm mx-auto"
        >
            {star.name} was born in <b>{star.birthPlace.city}</b>
            <br />
            You are at <b>{distance.toFixed(2)} km</b>
        </Box>
    )
}

function NextButton() {
    return (
        <Button
            variant='contained'
            color='error'
            onClick={() => handleNextGuess()}
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
    preGuess: Coord | undefined;
    guess: Coord | undefined;
    handleGuess: (value: Coord) => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    preGuess,
    guess,
    handleGuess
}) => {
    return (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
            <GuessResult guess={guess} />
            <div className="relative w-full flex justify-center items-center">
                <GuessButton preGuess={preGuess} guess={guess} handleGuess={handleGuess} />
                {guess && (
                    <div className='absolute right-0'>
                        <NextButton />
                    </div>
                )}
            </div>
        </div>
    );
}

export default OverlayComponent;