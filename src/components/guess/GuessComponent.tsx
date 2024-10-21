import MapComponent from "@/components/guess/MapComponent";
import useGuess from "@/hooks/useGuess";

const GuessComponent = () => {

    const { preGuess, guess, handlePreGuess, handleGuess } = useGuess();

    return (
        <div>
            <MapComponent preGuess={preGuess} guess={guess} handlePreGuess={handlePreGuess} answer={answer}  />
            <OverlayComponent handleGuess={handleGuess} preGuess={preGuess} />
        </div>
    );
}