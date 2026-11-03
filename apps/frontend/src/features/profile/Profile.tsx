import type { User } from '@cityborn/api';
import {
  type ProfileEditor,
  type ProfileGames,
  useProfileEditor,
  useProfileGames,
} from '@cityborn/client/profile';
import { formatDate } from '@cityborn/core';
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
import LoadingButton from '@/components/ui/buttons/LoadingButton';

export const Profile = ({ user }: { user: User }) => {
  const { games, isLoading }: ProfileGames = useProfileGames();
  const {
    usernameForm,
    isEditingUsername,
    startUsernameEdit,
    cancelUsernameEdit,
    submitUsername,
    emailForm,
    isEditingEmail,
    isEmailUpdated,
    startEmailEdit,
    cancelEmailEdit,
    submitEmail,
    passwordForm,
    isPasswordDialogOpen,
    isPasswordUpdated,
    openPasswordDialog,
    closePasswordDialog,
    submitPassword,
    isDeleteAccountDialogOpen,
    openDeleteAccountDialog,
    closeDeleteAccountDialog,
    deleteAccount,
  }: ProfileEditor = useProfileEditor();

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
                type="button"
                aria-label="Modifier le pseudo"
                onClick={(event) => {
                  event.preventDefault();
                  startUsernameEdit();
                }}
              >
                <EditIcon />
              </IconButton>
            </>
          )}
        </Box>
        <Box
          component="form"
          onSubmit={submitEmail}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          {isEditingEmail ? (
            <>
              <TextField
                type="email"
                label="Email"
                size="small"
                {...emailForm.register('email')}
                error={!!emailForm.formState.errors.email}
                helperText={emailForm.formState.errors.email?.message}
              />
              <IconButton
                type="submit"
                aria-label="Valider l'adresse e-mail"
                disabled={emailForm.formState.isSubmitting}
              >
                <CheckIcon />
              </IconButton>
              <IconButton
                type="button"
                aria-label="Annuler la correction de l'adresse e-mail"
                onClick={cancelEmailEdit}
              >
                <CloseIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Typography sx={{ flex: 1, overflowWrap: 'anywhere' }}>
                <strong>Email :</strong> {user.email}
              </Typography>
              {!user.isVerified && (
                <IconButton
                  type="button"
                  aria-label="Corriger l'adresse e-mail"
                  onClick={(event) => {
                    event.preventDefault();
                    startEmailEdit();
                  }}
                >
                  <EditIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>
        {isEmailUpdated && (
          <Alert severity="success">
            Un lien de vérification a été envoyé à ta nouvelle adresse.
          </Alert>
        )}
        {user.type === 'email' && (
          <Button variant="outlined" onClick={openPasswordDialog}>
            Modifier mon mot de passe
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          onClick={openDeleteAccountDialog}
        >
          Supprimer mon compte
        </Button>
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
            <Typography>Parties ({games.length})</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, m: 0 }}>
          {isLoading ? (
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
                          Partie #{gameRecord.id} -{' '}
                          {formatDate(gameRecord.createdAt)}
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

      <Dialog
        open={isDeleteAccountDialogOpen}
        onClose={closeDeleteAccountDialog}
      >
        <DialogTitle>Veux-tu vraiment supprimer ton compte ?</DialogTitle>
        <DialogActions>
          <Button type="button" onClick={closeDeleteAccountDialog}>
            Annuler
          </Button>
          <LoadingButton
            variant="contained"
            color="error"
            onClick={deleteAccount}
          >
            Supprimer
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
