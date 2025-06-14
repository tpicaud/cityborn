'use client';

import OverlayComponent from "@/components/guess/OverlayComponent";
import useGuess from "@/hooks/useGuess";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import RoundCountdownComponent from "./RoundCountdown";
import { Guess } from "@cityborn/types";
import { Game } from "@cityborn/types";
import { RoundStatus } from "@cityborn/types";

const GoogleMapComponent = dynamic(() => import('@/components/guess/maps/GoogleMapComponent'), { ssr: false });

interface GuessComponentProps {
    localPlayerID: string,
    game: Game,
    handleGuess: (guess: Guess) => void,
    handleNextRound: () => void,
}

const GuessComponent: React.FC<GuessComponentProps> = ({
    localPlayerID,
    game,
    handleGuess,
    handleNextRound,
}) => {

    const { preGuess, resetPreGuess, handlePreGuess, handleIsTimeUp } = useGuess(handleGuess);
    const [isRoundCountdownFinished, setIsRoundCountdownFinished] = useState(false);

    // Map properties
    const mapProps = {
        center: { lat: 48.8566, lng: 2.3522 },
        zoom: 2,
        preGuess,
        localPlayerID,
        game,
        handlePreGuess,
    };

    useEffect(() => {
        if (game.state.currentRound?.status === RoundStatus.GUESSING) {
            resetPreGuess()
            setIsRoundCountdownFinished(false)
        }
    }, [game.state.currentRound?.status])

    return (
        <div>
            <div className="fixed w-full h-full z-0">
                <GoogleMapComponent
                    API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!}
                    mapProps={mapProps}
                />
            </div>

            {!isRoundCountdownFinished && (
                <RoundCountdownComponent onCountdownEnd={() => setIsRoundCountdownFinished(true)} />
            )}

            {isRoundCountdownFinished && (
                <div className="z-10">
                    <OverlayComponent
                        localPlayerID={localPlayerID}
                        preGuess={preGuess}
                        game={game}
                        handleGuess={handleGuess}
                        handleIsTimeUp={handleIsTimeUp}
                        handleNextRound={handleNextRound}
                    />
                </div>
            )}
        </div>
    );
}

export default GuessComponent;