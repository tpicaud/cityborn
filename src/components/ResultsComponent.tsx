'use client';

import { PlayerResults, Result } from '@/types/Results';
import { calculateTotalPoints } from '@/utils/calculateScore';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface ResultsComponentProps {
    playerResults: PlayerResults;
}

const ResultsComponent: React.FC<ResultsComponentProps> = ({ playerResults }) => {

    const router = useRouter();

    return (
        <div className="h-full w-full">
            <div className="flex flex-col justify-center items-center gap-6">

                <h2 className="text-2xl font-bold flex flex-row items-end">
                    <p className='text-4xl'>{calculateTotalPoints(playerResults)}</p>
                    <span className='ml-2'>pts</span>
                </h2>

                {/* Table Container */}
                <TableContainer component={Paper} className="max-w-4xl shadow-lg">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><p className="font-bold">Name</p></TableCell>
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
                                            <p>{result.distance.toFixed(2)} km</p>
                                        ) : (
                                            <p>No guess</p>
                                        )}
                                    </TableCell>
                                    <TableCell>{result.points}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Restart Button */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push('/')}

                    className="bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                    End Game
                </Button>
            </div>
        </div>
    );
}

export default ResultsComponent;