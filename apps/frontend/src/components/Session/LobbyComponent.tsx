'use client';

import {
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useEffect, useState } from 'react';
import { SessionMode, Session, Category } from '@cityborn/types';
import { GameConfig } from '@cityborn/types';
import { OnlinePlayer } from '@cityborn/types';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import IconButton from '../ui/buttons/IconButton';
import LoadingButton from '../ui/buttons/LoadingButton';
import { useError } from '@/contexts/ErrorContext';
import { useApi } from '@/contexts/ApiContext';

const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LobbyComponent = ({
  localPlayerID,
  session,
  handleUpdateGameConfig,
  handleStartGame,
  handleJoinSession,
}: {
  localPlayerID: string | undefined;
  session: Session;
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleUpdateHost?: (newHostID: string) => Promise<void>;
  handleKickPlayer?: (playerToKick: string) => Promise<void>;
  handleJoinSession: (playerID: string) => Promise<void>;
}) => {
  const { invokeError } = useError();
  const apiClient = useApi();

  const [copied, setCopied] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tempNbOfObjects, setTempNbOfObjects] = useState(
    session.gameConfig.nbOfObjects.toString(),
  );
  const [tempTimer, setTempTimer] = useState<string>(
    session.gameConfig.timer.toString(),
  );
  const [currentInput, setCurrentInput] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await apiClient.fetchCategories();
        setCategories(categories);
      } catch {
        invokeError('Aucunes catégories trouvées');
      }
    };
    fetchCategories();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Réinitialise le message après 2 secondes
  };

  const updateGameConfig = async () => {
    // parse nb of objects
    const nbOfObjectsParsed = parseInt(tempNbOfObjects, 10);
    const nbOfObjects =
      isNaN(nbOfObjectsParsed) || nbOfObjectsParsed <= 0
        ? 6
        : nbOfObjectsParsed;

    // parse timer
    const timerParsed = parseInt(tempTimer, 10);
    const timer = isNaN(timerParsed) || timerParsed <= 0 ? 20 : timerParsed;

    await handleUpdateGameConfig({ nbOfObjects, timer });
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapContainer
          center={[0, 0]}
          zoom={3}
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>
      </div>

      <div
        className="relative z-10 flex flex-col items-center justify-center 
                            bg-transparent h-full w-full pointer-events-none"
      >
        <Box
          className="flex flex-col items-center gap-2 p-6 
                              bg-slate-100 shadow-xl rounded-2xl 
                                max-w-[90%] min-w-80 sm:w-[60%] md:w-[50%] max-h-[80%] pointer-events-auto"
        >
          {/* Titre du lobby */}
          <Typography variant="h5">{session.mode.toUpperCase()}</Typography>

          {session.mode === SessionMode.MULTI && (
            <div className="flex flex-col items-center justify-center w-[30%] min-w-40">
              {/* Champ pour afficher et copier l'ID du jeu */}
              <Typography variant="subtitle1">Code</Typography>
              <TextField
                fullWidth
                value={session.id}
                variant="outlined"
                slotProps={{
                  input: {
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={handleCopy}>
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  },
                }}
              />

              {copied && (
                <Typography variant="caption" color="success.main">
                  Copié !
                </Typography>
              )}
            </div>
          )}

          <div className="flex flex-row justify-start items-stretch gap-8 max-w-full">
            {/* Liste des joueurs */}
            {session.mode !== SessionMode.SOLO && (
              <List
                sx={{
                  flex: '1 1 50%',
                  p: 0,
                  '& .MuiListItem-root': {
                    py: 0.5,
                  },
                  '& .MuiListItemText-primary': {
                    fontSize: { xs: '0.85rem', md: '1rem' },
                  },
                  '& .MuiListItemText-secondary': {
                    fontSize: { xs: '0.75rem', md: '0.90rem' },
                  },
                }}
              >
                {(session.players.every((p) => 'connected' in p)
                  ? // Tous sont des OnlinePlayer → trier + statut
                    (session.players as OnlinePlayer[]).sort((a, b) =>
                      a.connected === b.connected ? 0 : a.connected ? -1 : 1,
                    )
                  : // Sinon, pas de tri
                    session.players
                ).map((player) => (
                  <ListItem key={player.username} divider>
                    <ListItemText
                      primary={
                        player.username === session.hostID
                          ? `${player.username} (Host)`
                          : `${player.username}`
                      }
                      secondary={
                        'connected' in player
                          ? (player as OnlinePlayer).connected
                            ? 'Connecté'
                            : 'Déconnecté'
                          : undefined
                      }
                      sx={{
                        color:
                          'connected' in player &&
                          !(player as OnlinePlayer).connected
                            ? 'text.disabled'
                            : 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <div className="flex-1 flex flex-col gap-3 max-w-full">
              <FormControl sx={{ width: '100%', marginTop: 2 }}>
                <InputLabel id="categories-input" shrink={true}>
                  Categories
                </InputLabel>
                <Select
                  multiple
                  displayEmpty
                  value={
                    session.gameConfig.categories.map((cat) => cat.id) ?? []
                  }
                  onChange={(e) => {
                    const value = e.target.value as string[];

                    if (value.includes('toggle_all')) {
                      // Si tout est déjà sélectionné, on désélectionne tout
                      if (
                        session.gameConfig.categories.length ===
                        categories.length
                      ) {
                        handleUpdateGameConfig({ categories: [] });
                      } else {
                        // Sinon, on sélectionne tout
                        handleUpdateGameConfig({ categories: [...categories] });
                      }
                      return;
                    }

                    const selected_categories: Category[] = value
                      .map((category_id) =>
                        categories.find(
                          (category) => category.id === category_id,
                        ),
                      )
                      .filter((category): category is Category => !!category);
                    handleUpdateGameConfig({ categories: selected_categories });
                  }}
                  input={<OutlinedInput label="Categories" />}
                  renderValue={(selected) => (
                    <Box
                      sx={{
                        display: 'block',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                      }}
                    >
                      {(selected as string[]).length !== 0
                        ? (selected as string[])
                            .map(
                              (cat_id) =>
                                categories.find((cat) => cat.id === cat_id)
                                  ?.name,
                            )
                            .join(', ')
                        : 'Toutes'}
                    </Box>
                  )}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    PaperProps: {
                      className:
                        'max-h-72 overflow-y-auto rounded-lg shadow-lg border border-neutral-800',
                      // max-h-72 => ~18rem, overflow-y-auto => scroll, arrondis + ombre
                    },
                  }}
                  className="overflow-y-auto"
                >
                  {/* Bouton dynamique Select All / Unselect All */}
                  <MenuItem
                    value="toggle_all"
                    className="ml-4 h-fit w-fit rounded-md border border-neutral-800"
                  >
                    <ListItemText
                      primary={
                        session.gameConfig.categories.length ===
                        categories.length
                          ? 'Tout désélectionner'
                          : 'Tout sélectionner'
                      }
                    />
                  </MenuItem>

                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Checkbox
                        checked={session.gameConfig.categories.some(
                          (c) => c.id === category.id,
                        )}
                      />
                      <ListItemText primary={category.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <div className="w-full flex flex-row gap-x-2">
                <TextField
                  type="number"
                  label="Personnalités"
                  variant="outlined"
                  fullWidth
                  value={tempNbOfObjects}
                  size="small"
                  onChange={(e) => {
                    setTempNbOfObjects(e.target.value); // on garde la valeur saisie, même vide
                  }}
                  onBlur={updateGameConfig}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.85rem', md: '1rem' },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '0.85rem', md: '1rem' },
                    },
                  }}
                />

                <TextField
                  type="number"
                  label="Timer"
                  variant="outlined"
                  fullWidth
                  value={tempTimer}
                  size="small"
                  onChange={(e) => {
                    setTempTimer(e.target.value);
                  }}
                  onBlur={updateGameConfig}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontSize: { xs: '0.85rem', md: '1rem' },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: { xs: '0.85rem', md: '1rem' },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bouton pour démarrer la partie */}
          <LoadingButton
            variant="contained"
            color="primary"
            fullWidth
            disabled={session.hostID !== localPlayerID}
            onClick={async () => {
              await updateGameConfig();
              await handleStartGame();
            }}
          >
            Démarrer la partie
          </LoadingButton>

          {/* Menu */}
          <LoadingButton
            variant="contained"
            color="primary"
            fullWidth
            disabled={session.hostID !== localPlayerID}
            onClick={() => router.push('/')}
          >
            Menu
          </LoadingButton>
        </Box>
      </div>

      <Dialog open={!localPlayerID}>
        <DialogTitle>
          <p>Entrez votre pseudo</p>
        </DialogTitle>
        <DialogContent className="flex flex-col justify-center">
          <TextField
            fullWidth
            style={{ marginTop: 10 }}
            label={'Pseudo'}
            variant="outlined"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
          />
          <LoadingButton
            variant="contained"
            color="primary"
            style={{ marginTop: 10 }}
            disabled={currentInput.trim() === ''}
            onClick={async () => await handleJoinSession(currentInput)}
          >
            <ArrowCircleRightIcon />
          </LoadingButton>
        </DialogContent>
      </Dialog>
      {/* {!localPlayerID && (
                <DialogInput message='Entrez votre pseudo' handleClick={handleJoinSession} label='Votre pseudo' />
            )} */}
    </div>
  );
};
