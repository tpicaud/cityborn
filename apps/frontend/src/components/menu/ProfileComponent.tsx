import type { User } from '@cityborn/api';
import { useProfile } from '@cityborn/client/profile';
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
import { useEffect } from 'react';
import { profileApi } from '@/lib/profileApi';

export const ProfileComponent = ({ user }: { user: User }) => {
  const { games, loading, refreshGames } = useProfile({
    profileApi,
    localPlayerID: user.username,
  });

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

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
            <Typography>Games ({games.length})</Typography>
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
          ) : games.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune partie jouée
            </Typography>
          ) : (
            <List dense>
              {games.map(({ gameRecord, localPlayerPoints, playerScores }) => (
                <ListItem
                  key={gameRecord.id}
                  divider
                  disableGutters
                  sx={{ p: 0 }}
                >
                  <Accordion
                    elevation={0}
                    disableGutters
                    sx={{ width: '100%' }}
                  >
                    <AccordionSummary>
                      <div className="flex flex-col w-full">
                        <Typography variant="subtitle2">
                          Partie #{gameRecord.id} - {gameRecord.createdAt}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {gameRecord.mode.toUpperCase()} • {localPlayerPoints}
                        </Typography>
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex flex-col gap-2">
                        <Typography variant="body2">
                          Joueurs :{' '}
                          {gameRecord.players
                            .map(({ username }) => username)
                            .join(', ')}
                        </Typography>
                        <Typography variant="body2">Scores :</Typography>
                        <List dense>
                          {playerScores.map(({ playerID, points }) => (
                            <ListItem key={playerID} disableGutters>
                              <ListItemText
                                primary={`${playerID} : ${points}`}
                              />
                            </ListItem>
                          ))}
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
