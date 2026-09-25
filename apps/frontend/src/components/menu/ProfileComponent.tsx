import type { User } from '@cityborn/api';
import { useError } from '@cityborn/client';
import { useAuth } from '@cityborn/client/auth';
import {
  toUpdatePassword,
  useChangePasswordForm,
  useProfile,
  useUsernameForm,
} from '@cityborn/client/profile';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { profileApi } from '@/lib/profileApi';
import { updatePassword, updateUsername } from '@/server/use-server/auth';

export const ProfileComponent = ({ user }: { user: User }) => {
  const { setUser } = useAuth();
  const { invokeError } = useError();
  const { games, loading, refreshGames } = useProfile({
    profileApi,
    localUser: user,
  });
  const usernameForm = useUsernameForm(user.username);
  const passwordForm = useChangePasswordForm();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] =
    useState<boolean>(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState<boolean>(false);

  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  const submitUsername = usernameForm.handleSubmit(async (data) => {
    const result = await updateUsername(data);
    if (!result.ok) return invokeError(result.error);

    setUser(result.data);
    usernameForm.reset({ username: result.data.username });
    setIsEditingUsername(false);
  });

  const cancelUsernameEdit = (): void => {
    usernameForm.reset({ username: user.username });
    setIsEditingUsername(false);
  };

  const closePasswordDialog = (): void => {
    passwordForm.reset();
    setIsPasswordUpdated(false);
    setIsPasswordDialogOpen(false);
  };

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    const result = await updatePassword(toUpdatePassword(values));
    if (!result.ok) return invokeError(result.error);

    setUser(result.data);
    passwordForm.reset();
    setIsPasswordUpdated(true);
  });

  return (
    <Box
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
        Profil
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box
          component="form"
          onSubmit={submitUsername}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {isEditingUsername ? (
            <>
              <TextField
                label="Pseudo"
                size="small"
                {...usernameForm.register('username')}
                error={!!usernameForm.formState.errors.username}
                helperText={usernameForm.formState.errors.username?.message}
              />
              <IconButton
                type="submit"
                aria-label="Valider le pseudo"
                disabled={usernameForm.formState.isSubmitting}
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Annuler la modification du pseudo"
                onClick={cancelUsernameEdit}
              >
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1 }}>
                <strong>Pseudo :</strong> {user.username}
              </Typography>
              <IconButton
                aria-label="Modifier le pseudo"
                onClick={() => setIsEditingUsername(true)}
              >
                <EditIcon />
              </IconButton>
            </>
          )}
        </Box>
        <Typography>
          <strong>Email :</strong> {user.email}
        </Typography>
        {user.type === 'email' && (
          <Button
            variant="outlined"
            onClick={() => setIsPasswordDialogOpen(true)}
          >
            Modifier mon mot de passe
          </Button>
        )}
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
            <Typography>Parties ({games.length})</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, m: 0 }}>
          {loading ? (
            <List dense>
              {[1, 2, 3].map((index: number) => (
                <ListItem key={index} divider>
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

      <Dialog open={isPasswordDialogOpen} onClose={closePasswordDialog}>
        <Box component="form" onSubmit={submitPassword}>
          <DialogTitle>Modifier mon mot de passe</DialogTitle>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
          >
            <TextField
              type="password"
              label="Mot de passe actuel"
              {...passwordForm.register('currentPassword')}
              error={!!passwordForm.formState.errors.currentPassword}
              helperText={
                passwordForm.formState.errors.currentPassword?.message
              }
            />
            <TextField
              type="password"
              label="Nouveau mot de passe"
              {...passwordForm.register('newPassword')}
              error={!!passwordForm.formState.errors.newPassword}
              helperText={passwordForm.formState.errors.newPassword?.message}
            />
            <TextField
              type="password"
              label="Confirmer le nouveau mot de passe"
              {...passwordForm.register('confirmPassword')}
              error={!!passwordForm.formState.errors.confirmPassword}
              helperText={
                passwordForm.formState.errors.confirmPassword?.message
              }
            />
            {isPasswordUpdated && (
              <Alert severity="success">Mot de passe modifié.</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={closePasswordDialog}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              loading={passwordForm.formState.isSubmitting}
            >
              Valider
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
