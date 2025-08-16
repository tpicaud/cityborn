'use client';

import { getEndSentence } from '@/services/LocalGameService';
import { GuessObject, PlayerResults } from '@cityborn/types';
import { calculateTotalPoints } from '@/utils/calculateScore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingComponent from '../others/LoadingComponent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Game } from '@cityborn/types';
import { getGameResult } from '@/utils/getGameResult';

const ResultsComponent = ({
    game,
    localPlayerID,
    handleEnd,
    handlePlayAgain
}: {
    game: Game,
    localPlayerID: string,
    handleEnd: () => void,
    handlePlayAgain: () => void
}) => {

    const router = useRouter();

    const playersResults = getGameResult(game);
    const [sentence, setSentence] = useState<{ message: string, sub_message_1: string, sub_message_2: string }>();
    const [localPlayerResults, setLocalPlayerResults] = useState<PlayerResults>()

    useEffect(() => {
        const currentPlayerResults = playersResults.get(localPlayerID);
        if (!currentPlayerResults) return;

        // Remplacement des IDs dans tous les résultats
        replaceIdsWithNames(playersResults, game.state.guessObjects!);

        setLocalPlayerResults(currentPlayerResults);

        let isMounted = true;
        generateEndSentence(currentPlayerResults).then(sentence => {
            if (isMounted) {
                setSentence(sentence);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [localPlayerID, game.id]);


    function replaceIdsWithNames(resultsMap: Map<string, PlayerResults>, guessObjects: GuessObject[]) {
        resultsMap.forEach((playerResults) => {
            playerResults.results.forEach((result) => {
                const guessObject = guessObjects.find(obj => obj.id === result.guessObjectId);
                if (guessObject) {
                    result.guessObjectId = guessObject.name;
                }
            });
        });
    }

    async function generateEndSentence(playerResults: PlayerResults): Promise<{ message: string, sub_message_1: string, sub_message_2: string }> {
        const totalPoints = calculateTotalPoints(playerResults);
        const getScoreType = (points: number) => {
            if (points < 3000) return 'Mauvais';
            if (points < 5000) return 'Moyen';
            return 'Bon';
        };

        const scoreType = getScoreType(totalPoints);
        const message = ''// await getEndSentence(scoreType);

        let sub_message_1 = '';
        let sub_message_2 = '';

        if (scoreType === 'Mauvais') {
            sub_message_1 = 'Bon... ';
            sub_message_2 = 'Essaie encore !';
        } else if (scoreType === 'Bon') {
            sub_message_1 = 'Félicitation ! ';
        } else if (scoreType === 'Moyen') {
            sub_message_2 = 'Essaie encore !';
        }

        return { message, sub_message_1, sub_message_2 };
    }


    useEffect(() => {
        console.log(sentence, localPlayerResults);
    }, [sentence, localPlayerResults])

    if (!sentence || !localPlayerResults) {
        return <LoadingComponent message='Chargement des résultats' />
    }


    return (
        <Box className="flex flex-col items-center gap-2 p-6 bg-slate-100 shadow-xl backdrop-blur-md rounded-2xl w-full pointer-events-auto">
            <div className="h-full w-full overflow-y-auto">
                <div className="w-full h-full flex flex-col justify-center items-center gap-2">
                    <div className='flex flex-col justify-center items-center gap-2'>
                        <h1 className="font-bold flex flex-row items-end">
                            <p className='text-4xl'>{calculateTotalPoints(localPlayerResults)}</p>
                            <p className='ml-2 mb-1 text-xl'>pts</p>
                        </h1>
                        <h2 className='text-center text-base md:text-xl'>{sentence.sub_message_1}{sentence.message}</h2>
                        <h2 className='text-center text-xl'>{sentence.sub_message_2}</h2>
                    </div>

                    <div className='w-full h-full flex flex-col justify-center items-center'>
                        {playersResults.size === 1 ? (
                            // Si un seul joueur, afficher une liste
                            Array.from(playersResults.entries()).map(([player, playerResults]) => (
                                <div key={player} className="w-full max-w-[90%] border border-gray-200 rounded-lg shadow-lg">
                                    <TableContainer component={Paper} className="shadow-lg">
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><p className="font-bold">Nom</p></TableCell>
                                                    <TableCell><p className="font-bold">Distance (km)</p></TableCell>
                                                    <TableCell><p className="font-bold">Points</p></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {playerResults.results.map((result, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{result.guessObjectId}</TableCell>
                                                        <TableCell>
                                                            {result.distance !== -1 ? (
                                                                <p>{result.distance.toFixed(2)}</p>
                                                            ) : (
                                                                <p>Pas de guess</p>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{result.points}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </div>
                            ))
                        ) : (
                            // Si plusieurs joueurs, afficher l'accordéon
                            Array.from(playersResults.entries())
                                .sort(([, aResults], [, bResults]) => calculateTotalPoints(bResults) - calculateTotalPoints(aResults))
                                .map(([player, playerResults]) => (
                                    <Accordion key={player} className="max-w-4xl w-[80%]">
                                        <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
                                            <h3 className="font-bold">{player} - {calculateTotalPoints(playerResults)} pts</h3>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer component={Paper} className="shadow-lg">
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell><p className="font-bold">Nom</p></TableCell>
                                                            <TableCell><p className="font-bold">Distance (km)</p></TableCell>
                                                            <TableCell><p className="font-bold">Points</p></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {playerResults.results.map((result, index) => (
                                                            <TableRow key={index}>
                                                                <TableCell>{result.guessObjectId}</TableCell>
                                                                <TableCell>
                                                                    {result.distance !== -1 ? (
                                                                        <p>{result.distance.toFixed(2)}</p>
                                                                    ) : (
                                                                        <p>Pas de guess</p>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>{result.points}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                        )}
                    </div>

                    <div className='flex flex-col justify-center items-center w-full gap-3'>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePlayAgain}
                            className="w-24"
                        >
                            Rejouer
                        </Button>
                        <div className='flex flex-row justify-center w-full gap-3'>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleEnd}
                                className="w-24"
                            >
                                Lobby
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => {
                                    router.push('/');
                                    handleEnd();
                                }}
                                className="w-24"
                            >
                                Menu
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );

}

export default ResultsComponent;