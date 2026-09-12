'use client';

import type { User } from '@cityborn/api';
import { useGameRecords } from '@cityborn/client/profile/react';
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
import { userGateway } from '@/lib/gateways';

export const ProfileComponent = ({ user }: { user: User }) => {
  const { gameRecords, isLoading } = useGameRecords(userGateway, user.username);

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

      <Accordion disabled={isLoading} sx={{ p: 0, m: 0 }}>
        <AccordionSummary
          expandIcon={!isLoading ? <ExpandMoreIcon /> : null}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center w-full h-full ">
              <CircularProgress size={20} />
            </div>
          ) : (
            <Typography>Games ({gameRecords.length})</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails
          sx={{
            p: 0,
            m: 0,
          }}
        >
          {isLoading ? (
            <List dense>
              {[1, 2, 3].map((i) => (
                <ListItem key={i} divider>
                  <ListItemText primary={<CircularProgress size={15} />} />
                </ListItem>
              ))}
            </List>
          ) : gameRecords.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune partie jouée
            </Typography>
          ) : (
            <List dense>
              {gameRecords.map((gameRecord) => (
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
                          Partie #{gameRecord.id} - {gameRecord.playedAt}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {gameRecord.mode.toUpperCase()} •{' '}
                          {gameRecord.totalPoints}
                        </Typography>
                      </div>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="flex flex-col gap-2">
                        <Typography variant="body2">
                          Joueurs : {gameRecord.playerUsernames.join(', ')}
                        </Typography>
                        <Typography variant="body2">Scores :</Typography>
                        <List dense>
                          {gameRecord.scores.map((score) => (
                            <ListItem key={score.username} disableGutters>
                              <ListItemText
                                primary={`${score.username} : ${score.totalPoints}`}
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
