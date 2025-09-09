'use client';

import { Guess, Session } from "@cityborn/types";
import { Box } from "@mui/material";
import GuessObjectComponent from "./GuessObjectComponent";
import TimerComponent from "./TimerComponent";
import { Round } from "@cityborn/types";
import { RoundStatus } from "@cityborn/types";
import { Game } from "@cityborn/types";
import { useEffect, useState } from "react";
import { GuessObject } from "@cityborn/types";
import LoadingButton from "../ui/buttons/LoadingButton";

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
        <LoadingButton
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
        </LoadingButton>
    );
}


function GuessResult({
    currentRound,
    guessObject,
    localPlayerID
}: {
    currentRound: Round,
    guessObject: GuessObject,
    localPlayerID: string
}) {
    return (currentRound.playersGuesses && currentRound.status === RoundStatus.SHOWING_RESULTS) && (
        <div className="flex flex-col m-2 gap-2 items-center justify-center w-full">
            {/* Box for points */}
            <Box className="flex flex-col py-2 px-4 text-xl md:text-xl lg:text-2xl text-center bg-green-200 text-green-600 rounded shadow-sm">
                <p><b>{currentRound.playersGuesses[localPlayerID].points}</b> pts</p>
                {Object.keys(currentRound.playersGuesses).length > 1 && (
                    <>
                        <hr className="my-1 border-green-600 w-[70%] self-center" />
                        <div className="flex flex-wrap justify-center mt-2 gap-1 text-sm w-full">
                            {Object.entries(currentRound.playersGuesses).map(([playerID, guess]) => {
                                if (playerID === localPlayerID) return null; // skip self

                                return (
                                    <div key={playerID} className="px-1 text-green-700 text-xs md:text-base ">
                                        <b>{playerID}</b>: {guess.points}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Box>
            <Box className="p-2 text-xs md:text-base lg:text-xl text-center bg-blue-200 text-blue-600 rounded shadow-sm w-full" >
                <p><b>{guessObject.name}</b> est né à <b>{guessObject.answer.place_name}</b></p>
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
    localPlayerID: string,
    preGuess: Guess | undefined,
    session: Session
    game: Game,
    handleGuess: (value: Guess) => void;
    handleIsTimeUp: () => void;
    handleNextRound: () => void;
}

const OverlayComponent: React.FC<OverlayComponentProps> = ({
    localPlayerID,
    preGuess,
    session,
    game,
    handleGuess,
    handleIsTimeUp,
}) => {
    const [timerEnded, setTimerEnded] = useState(false);

    useEffect(() => {
        setTimerEnded(false)
    }, [game.state.currentRound?.guessObjectId])

    useEffect(() => {
        if (timerEnded) {
            handleIsTimeUp()
        }
    }, [timerEnded])

    return (
        <div>
            <GuessObjectComponent guessObject={game.state.guessObjects!.find(guessObject => game.state.currentRound!.guessObjectId === guessObject.id)!} />
            <div className="absolute w-[27%] mx-6 my-14">
                {(game.state.currentRound!.status === RoundStatus.GUESSING) && (
                    <TimerComponent totalTime={session.gameConfig.timer} endMessage="Terminé !" setTimerEnded={setTimerEnded} />
                )}
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">

                {game.state.currentRound!.status === RoundStatus.GUESSING && (
                    <div className="relative w-full flex justify-center items-center">
                        <GuessButton
                            preGuess={preGuess}
                            disabled={
                                (!preGuess) || (game.state.currentRound?.playersGuesses?.[localPlayerID] !== undefined)
                            }
                            handleGuess={handleGuess} />
                    </div>
                )}

                {game.state.currentRound && game.state.currentRound!.status === RoundStatus.SHOWING_RESULTS && (
                    <GuessResult
                        currentRound={game.state.currentRound!}
                        guessObject={game.state.guessObjects!.find(guessObject => game.state.currentRound!.guessObjectId === guessObject.id)!}
                        localPlayerID={localPlayerID}
                    />
                )}

            </div>
        </div>
    );
}

export default OverlayComponent;