'use client';

import { type Game, type PlayerResults, SessionMode } from '@cityborn/api';
import {
  getGameResult,
  getGuessObjectName,
  sortPlayersByTotalPoints,
} from '@cityborn/client/game';
import type { SessionController } from '@cityborn/client/session';
import { calculateTotalPoints } from '@cityborn/core';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';
import LoadingComponent from '../others/LoadingComponent';
import LoadingButton from '../ui/buttons/LoadingButton';

const ResultsComponent = ({
  game,
  localPlayerID,
  mode,
  sessionController,
}: {
  game: Game;
  localPlayerID: string;
  mode: SessionMode;
  sessionController: SessionController;
}) => {
  const playersResults = getGameResult(game);
  const [localPlayerResults, setLocalPlayerResults] = useState<PlayerResults>();

  useEffect(() => {
    const currentPlayerResults = playersResults.get(localPlayerID);
    if (!currentPlayerResults) return;

    setLocalPlayerResults(currentPlayerResults);
  }, [localPlayerID, playersResults.get]);

  if (!localPlayerResults) {
    return <LoadingComponent message="Chargement des résultats" />;
  }

  return (
    <Box className="flex flex-col items-center gap-2 p-6 bg-slate-100 shadow-xl backdrop-blur-md rounded-2xl w-full pointer-events-auto">
      <div className="h-full w-full overflow-y-auto">
        <div className="w-full h-full flex flex-col justify-center items-center gap-2">
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="font-bold flex flex-row items-end">
              <p className="text-4xl">
                {calculateTotalPoints(localPlayerResults)}
              </p>
              <p className="ml-2 mb-1 text-xl">pts</p>
            </h1>
          </div>

          <div className="w-full max-h-[40vh] overflow-auto flex flex-col justify-start items-center">
            {playersResults.size === 1
              ? Array.from(playersResults.entries()).map(
                  ([player, playerResults]) => (
                    <div
                      key={player}
                      className="w-full border border-gray-200 rounded-lg shadow-lg"
                    >
                      <TableContainer component={Paper} className="shadow-lg">
                        <Table
                          size="small"
                          sx={{
                            '& td, & th': {
                              padding: {
                                xs: '4px 8px',
                              },
                              fontSize: {
                                xs: '0.8rem',
                                sm: '1rem',
                                md: '1.2rem',
                              },
                            },
                          }}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>Nom</TableCell>
                              <TableCell align="right">Distance (km)</TableCell>
                              <TableCell align="right">Points</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {playerResults.results.map((result) => (
                              <TableRow
                                key={result.guessObjectId}
                                sx={{
                                  '&:last-child td, &:last-child th': {
                                    border: 0,
                                  },
                                }}
                              >
                                <TableCell component="th" scope="row">
                                  {getGuessObjectName(
                                    game,
                                    result.guessObjectId,
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {result.distance !== -1 ? (
                                    <p>{result.distance.toFixed(2)}</p>
                                  ) : (
                                    <p>Pas de guess</p>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {result.points}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </div>
                  ),
                )
              : sortPlayersByTotalPoints(playersResults).map(
                  ([player, playerResults]) => (
                    <Accordion key={player} className="w-full">
                      <AccordionSummary expandIcon={<KeyboardArrowDownIcon />}>
                        <h3 className="font-bold">
                          {player} - {calculateTotalPoints(playerResults)} pts
                        </h3>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer
                          component={Paper}
                          elevation={0}
                          className="w-full"
                        >
                          <Table
                            size="small"
                            sx={{
                              width: '100%',
                              '& td, & th': {
                                padding: {
                                  xs: '4px 8px',
                                },
                                fontSize: {
                                  xs: '0.8rem',
                                  sm: '1rem',
                                  md: '1.2rem',
                                },
                              },
                            }}
                          >
                            <TableHead>
                              <TableRow>
                                <TableCell>Nom</TableCell>
                                <TableCell align="right">
                                  Distance (km)
                                </TableCell>
                                <TableCell align="right">Points</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {playerResults.results.map((result) => (
                                <TableRow
                                  key={result.guessObjectId}
                                  sx={{
                                    '&:last-child td, &:last-child th': {
                                      border: 0,
                                    },
                                  }}
                                >
                                  <TableCell component="th" scope="row">
                                    {getGuessObjectName(
                                      game,
                                      result.guessObjectId,
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    {result.distance !== -1 ? (
                                      <p>{result.distance.toFixed(2)}</p>
                                    ) : (
                                      <p>Pas de guess</p>
                                    )}
                                  </TableCell>
                                  <TableCell align="right">
                                    {result.points}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ),
                )}
          </div>

          <div className="flex flex-col justify-center items-center w-full gap-3">
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={sessionController.playAgain}
              disabled={mode !== SessionMode.SOLO && !sessionController.isHost}
              className="w-24"
            >
              Rejouer
            </LoadingButton>
            <div className="flex flex-row justify-center w-full gap-3">
              <LoadingButton
                variant="contained"
                color="primary"
                onClick={sessionController.endGame}
                className="w-24"
              >
                Lobby
              </LoadingButton>
              <LoadingButton
                variant="contained"
                color="primary"
                onClick={sessionController.exitGame}
                className="w-24"
              >
                Menu
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default ResultsComponent;
