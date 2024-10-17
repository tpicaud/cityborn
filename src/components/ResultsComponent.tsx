'use client';

import { GameSession, GuessResult } from '@/entities/GameSession';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Backdrop } from '@mui/material';
import { Button } from '@mui/material';

interface ResultsComponentProps {
    gameSession: GameSession;
    handleEndGame: () => void;
}

const ResultsComponent: React.FC<ResultsComponentProps> = ({ gameSession, handleEndGame }) => {

    return (
        <div>
            <Backdrop
                sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
                open={true}
                className="flex flex-col items-center justify-center min-h-screen"
            >
                <h2 className="text-2xl font-bold mb-4">Game Results</h2>

                {/* Table Container */}
                <TableContainer component={Paper} className="max-w-4xl w-[90%] mb-8 shadow-lg">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell className="font-bold">Star</TableCell>
                                <TableCell className="font-bold">Distance (km)</TableCell>
                                <TableCell className="font-bold">Points</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gameSession.results.map((result: GuessResult, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{result.star}</TableCell>
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
                    onClick={handleEndGame}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                >
                    End Game
                </Button>
            </Backdrop>
        </div>
    );
}

export default ResultsComponent;
