import type { GameRecord, User } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { calculateTotalPoints } from '@cityborn/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { getGameRecords } from '@/server/use-server/user';

export const ProfileComponent = ({ user }: { user: User }) => {
  const { invokeError } = useError();
  const [games, setGames] = useState<GameRecord[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getGameRecords();
        if (!result.ok) return invokeError(result.error);
        const gameRecords: GameRecord[] = result.data;
        setGames(gameRecords);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invokeError]);

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        maxWidth: 300,
        padding: 1,
        maxHeight: '80vh',
        overflow: 'auto',
      }}
    >
      <Typography variant="h5" align="center">
        Profile
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography>
          <strong>Username:</strong> {user.username}
        </Typography>
        <Typography>
          <strong>Email:</strong> {user.email}
        </Typography>
      </Box>

      <Accordion disabled={loading} sx={{ p: 0, m: 0 }}>
        <AccordionSummary
          expandIcon={!loading ? <ExpandMoreIcon /> : null}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center w-full h-full ">
              <CircularProgress size={20} />
            </div>
          ) : (
            <Typography>Games ({games?.length ?? 0})</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails
          sx={{
            p: 0,
            m: 0,
          }}
        >
          {loading ? (
            <List dense>
              {[1, 2, 3].map((i) => (
                <ListItem key={i} divider>
                  <ListItemText primary={<CircularProgress size={15} />} />
                </ListItem>
              ))}
            </List>
          ) : !games || games.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune partie jouée
            </Typography>
          ) : (
            <List dense>
              {games.map((game) => (
                <ListItem key={game.id} divider disableGutters sx={{ p: 0 }}>
                  <Accordion
                    elevation={0}
                    disableGutters
                    sx={{ width: '100%' }}
                  >
                    <AccordionSummary>
                      <div className="flex flex-col w-full">
                        <Typography variant="subtitle2">
                          Partie #{game.id ?? '-'} - {game.createdAt}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {game.mode.toUpperCase()} •{' '}
                          {calculateTotalPoints(game.results[user.username])}
                        </Typography>
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex flex-col gap-2">
                        <Typography variant="body2">
                          Joueurs :{' '}
                          {game.players.map((p) => p.username).join(', ')}
                        </Typography>
                        <Typography variant="body2">Scores :</Typography>
                        <List dense>
                          {Object.entries(game.results).map(
                            ([playerId, result]) => (
                              <ListItem key={playerId} disableGutters>
                                <ListItemText
                                  primary={`${
                                    game.players.find(
                                      (p) => p.username === playerId,
                                    )?.username ?? playerId
                                  } : ${calculateTotalPoints(result)}`}
                                />
                              </ListItem>
                            ),
                          )}
                        </List>
                      </div>
                    </AccordionDetails>
                  </Accordion>
                </ListItem>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};
