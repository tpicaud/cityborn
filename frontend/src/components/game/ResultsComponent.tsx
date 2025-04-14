'use client';

import { getEndSentence } from '@/services/LocalGameService';
import { PlayerResults } from '@/types/Results';
import { calculateTotalPoints } from '@/utils/calculateScore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingComponent from '../others/LoadingComponent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const ResultsComponent = ({
    playersResults,
    localPlayerID
}: {
    playersResults: Map<string, PlayerResults>,
    localPlayerID: string
}) => {

    const router = useRouter();

    const [sentence, setSentence] = useState<{ message: string, sub_message_1: string, sub_message_2: string }>();
    const [localPlayerResults, setLocalPlayerResults] = useState<PlayerResults>()

    useEffect(() => {
        const currentPlayerResults = playersResults.get(localPlayerID);
        if (!currentPlayerResults) return;

        setLocalPlayerResults(currentPlayerResults);

        const getScoreType = (totalPoints: number) => {
            if (totalPoints < 3000) return 'Mauvais';
            if (totalPoints < 5000) return 'Moyen';
            return 'Bon';
        };

        let isMounted = true;

        const fetchSentence = async () => {
            const totalPoints = calculateTotalPoints(currentPlayerResults);
            if (totalPoints > 0) {
                const score_type = getScoreType(totalPoints);
                const sentence = await getEndSentence(score_type);

                let sub_message_1 = '';
                let sub_message_2 = '';

                if (score_type === 'Mauvais') {
                    sub_message_1 = 'Bon... ';
                    sub_message_2 = 'Essaie encore !';
                } else if (score_type === 'Bon') {
                    sub_message_1 = 'Félicitation ! ';
                } else if (score_type === 'Moyen') {
                    sub_message_2 = 'Essaie encore !';
                }

                if (isMounted) {
                    setSentence({ message: sentence, sub_message_1, sub_message_2 });
                }
            }
        };

        fetchSentence();

        return () => {
            isMounted = false;
        };
    }, [localPlayerID]); // Ajout de localPlayerID


    if (!sentence || !localPlayerResults) {
        return <LoadingComponent message='Chargement des résultats' />
    }


    return (
        <div className="h-full w-full my-2 overflow-y-auto">
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
                                                    <TableCell>{result.guessObjectName}</TableCell>
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
                                                        <TableCell>{result.guessObjectName}</TableCell>
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
    
                <div className='flex flex-row justify-center w-full gap-3'>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/')}
                        className="w-24"
                    >
                        Menu
                    </Button>
                </div>
            </div>
        </div>
    );
    
}

export default ResultsComponent;