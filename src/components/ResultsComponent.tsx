'use client';

import { getEndSentence } from '@/services/LocalGameService';
import { PlayerResults, Result } from '@/types/Results';
import { calculateTotalPoints } from '@/utils/calculateScore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ResultsComponentProps {
    playerResults: PlayerResults;
}

const ResultsComponent: React.FC<ResultsComponentProps> = ({ playerResults }) => {

    const router = useRouter();

    const [sentence, setSentence] = useState('');

    useEffect(() => {
        const getScoreType = (totalPoints: number) => {
            switch (true) { 
                case totalPoints < 3500:
                    return 'Mauvais';
                case totalPoints < 4500:
                    return 'Moyen';
                default:
                    return 'Bon';
            }
        };

        const fetchSentence = async () => {
            const totalPoints = calculateTotalPoints(playerResults);
            if (totalPoints > 0) {
                const score_type = getScoreType(totalPoints);
                const sentence: string = await getEndSentence(score_type);
                setSentence(sentence);
            }
        };

        fetchSentence();
    }, [playerResults]);


    return (
        <div className="h-full w-full">
            <div className="flex flex-col justify-center items-center gap-6">

                <h1 className="font-bold flex flex-row items-end">
                    <p className='text-4xl'>{calculateTotalPoints(playerResults)}</p>
                    <p className='ml-2 mb-1 text-xl'>pts</p>
                </h1>

                <h2 className='text-center text-xl'>{sentence}</h2>

                {/* Table Container */}
                <TableContainer component={Paper} className="max-w-4xl shadow-lg">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><p className="font-bold">Nom</p></TableCell>
                                <TableCell><p className="font-bold">Distance (km)</p></TableCell>
                                <TableCell><p className="font-bold">Points</p></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {playerResults.results.map((result: Result, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{result.guessObject.name}</TableCell>
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

                <div className='flex flex-row justify-center w-full gap-3'>
                    <Button
                        variant='contained'
                        color='primary'
                        onClick={() => router.back()}
                        className='w-24'
                    >
                        Rejouer
                    </Button>
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