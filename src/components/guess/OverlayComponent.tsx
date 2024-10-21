import Coord from "@/types/Coord";

interface OverlayComponentProps {
    preGuess: Coord | undefined;
    handleGuess: (value: Coord) => void;
}

const OverlayComponent = () => {
    return (
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                {hasGuessed && (
                    <Box
                        className="mb-4 p-2 text-center bg-blue-200 text-blue-600 rounded shadow-sm mx-auto"
                    >
                        {star.name} was born in <b>{star.birthPlace.city}</b>
                        <br />
                        You are at <b>{distance.toFixed(2)} km</b>
                    </Box>
                )}

                <div className="relative w-full flex justify-center items-center">
                    <Button
                        variant="contained"
                        onClick={handleGuess}
                        disabled={!marker || hasGuessed}
                        className='text-white font-bold rounded py-2 px-4 w-[50%] block text-center'
                    >
                        Guess
                    </Button>

                    {hasGuessed && (
                        <div className='absolute right-0'>
                            <Button
                                variant='contained'
                                color='error'
                                onClick={() => handleNextStar()}
                                sx={{
                                    borderRadius: '20px',
                                }}
                                className="text-white font-bold"
                            >
                                <ArrowForward />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
    );
}