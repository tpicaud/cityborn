'use client';

import { PlayerResults, Result } from '@/types/Results';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Backdrop } from '@mui/material';
import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

interface ResultsComponentProps {
    playerResults: PlayerResults;
    resetGame: () => void;
}

const ResultsComponent: React.FC<ResultsComponentProps> = ({ playerResults, resetGame }) => {

    const router = useRouter();

    return (
        <div>
            <Backdrop
                sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
                open={true}
                className="flex flex-col items-center justify-center min-h-screen"
            >
                <h2 className="text-2xl font-bold mb-4">Game Results</h2>

                {/* Table Container */}
                <TableContainer component={Paper} sx={{ width: '90%' }} className="max-w-4xl mb-8 shadow-lg">
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
                                    <TableCell>{result.distance.toFixed(2)} km</TableCell>
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
                    onClick={
                        () => {
                            resetGame();
                            router.push('/')
                        }
                    }

                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                >
                    End Game
                </Button>
            </Backdrop>
        </div>
    );
}

export default ResultsComponent;