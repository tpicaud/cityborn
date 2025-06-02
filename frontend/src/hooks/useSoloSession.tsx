import Game from "@/types/Game";
import IUseSession from "./IUseSession";
import Guess from "@/types/Guess";
import { RoundStatus } from "@/enums/RoundStatus";
import { Result } from "@/types/Results";
import { GameStatus } from "@/enums/GameStatus";
import { Session } from "@/types/Session";
import GameConfig from "@/types/GameConfig";
import { useEffect, useState } from "react";
import { SessionStatus } from "@/enums/SessionStatus";
import { createGame } from "@/utils/SessionService";

export function useSoloSession(
    session: Session | undefined,
    localPlayerID: string | undefined,
    setSession: React.Dispatch<React.SetStateAction<Session | undefined>>,
): IUseSession {

    const [game, setGame] = useState<Game>();
    const [inGame, setInGame] = useState(false);

    ////////////////
    // useEffects //
    ////////////////
    useEffect(() => {
        if (session) {
            setSession((prevSession) => {
                if (!prevSession) {
                    throw new Error('Cannot start game because session is not initialized');
                }
                return {
                    ...prevSession,
                    status: inGame ? SessionStatus.IN_GAME : SessionStatus.IN_LOBBY,
                }
            });
        }
    }, [inGame])

    useEffect(() => {
        setSession((prevSession) => {
            if (prevSession) {
                return {
                    ...prevSession,
                    currentGame: game
                }
            }
        })
    }, [game])


    ///////////////
    // Functions //
    ///////////////
    const updateGameConfig = (newConfig: Partial<GameConfig>) => {
        if (!session) return;

        setSession((prevSession) => {
            if (!prevSession) {
                throw new Error('Cannot start game because session is not initialized');
            }
            return {
                ...prevSession,
                gameConfig: { ...prevSession.gameConfig, ...newConfig }
            }
        })
    }

    const startGame = async () => {
        if (!session) return;

        try {
            // Fetch game
            const game = await createGame(session.gameConfig);

            // Start game
            setGame({
                ...game,
                currentRound: {
                    status: RoundStatus.GUESSING,
                    guessObjectId: game.guessObjectsIds[0],
                    playersGuesses: {},
                }
            })

            setInGame(true);
        } catch (error) {
            throw new Error('Error fetching new game')
        }
    };

    const handleGuess = (guess: Guess) => {
        setGame((prevGame) => {
            if (!prevGame || !prevGame.currentRound || !localPlayerID) return prevGame;

            return {
                ...prevGame,
                currentRound: {
                    ...prevGame.currentRound,
                    status: RoundStatus.SHOWING_RESULTS,
                    playersGuesses: {
                        ...prevGame.currentRound.playersGuesses,
                        [localPlayerID]: guess,
                    },
                },
            };
        });
    };


    const handleNextRound = () => {
        if (!session || !game) return;

        // Record result of the round
        setGame((prevGame) => {
            if (!prevGame || !prevGame.currentRound) return prevGame;

            const { guessObjectId, playersGuesses } = prevGame.currentRound;

            if (!playersGuesses) return prevGame;

            // Utilisation d'un Record à la place d'une Map
            const updatedResults = { ...prevGame.results };  // Copier l'objet pour ne pas muter l'état original

            for (const [playerID, guess] of Object.entries(playersGuesses)) {
                const newResult: Result = {
                    guessObjectId,
                    distance: guess.distance,
                    points: guess.points,
                };

                // Accéder ou créer le playerResults pour chaque joueur
                if (!updatedResults[playerID]) {
                    updatedResults[playerID] = { results: [] };  // Initialisation si non existant
                }

                updatedResults[playerID].results.push(newResult);  // Ajouter le nouveau résultat
            }

            return {
                ...prevGame,
                results: updatedResults,  // Retourner les résultats mis à jour
            };
        });


        // Go to next guessObject
        const nextObjectIndex = getNextObjectId();

        if (nextObjectIndex) {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    currentRound: {
                        status: RoundStatus.GUESSING,
                        guessObjectId: nextObjectIndex,
                        playersGuesses: {},
                    },
                }
            });
        }
    };

    const getNextObjectId = (): string | null => {
        if (!game) return null;

        // get current index
        const currentIndex = game.guessObjectsIds.findIndex(id => game.currentRound?.guessObjectId === id);

        // Vérifier que l'objet est dans la liste
        if (currentIndex === undefined) {
            throw new Error("L'objet à deviner ne fais pas partie de la liste de la partie");
        }

        if (currentIndex + 1 < game.guessObjects.length) {
            return game.guessObjectsIds[currentIndex + 1];
        } else {
            setGame((prevGame) => {
                if (!prevGame) return prevGame;

                return {
                    ...prevGame,
                    status: GameStatus.IN_RESULTS
                };
            });
            return null;
        }
    };

    const endGame = () => {
        setGame(undefined);
        setInGame(false);
    }

    return {
        updateGameConfig,
        startGame,
        handleNextRound,
        handleGuess,
        endGame
    }
}