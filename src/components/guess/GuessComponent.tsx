import MapComponent from "@/components/guess/MapComponent";
import OverlayComponent from "@/components/guess/OverlayComponent";
import useGuess from "@/hooks/useGuess";

const GuessComponent = () => {

    const { preGuess, guess, handlePreGuess, handleGuess } = useGuess();

    return (
        <div>
            <MapComponent preGuess={preGuess} guess={guess} handlePreGuess={handlePreGuess} answer={answer}  />
            <OverlayComponent preGuess={preGuess} guess={guess} handleGuess={handleGuess} />
        </div>
    );
}