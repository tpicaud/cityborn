'use client';

import {
  type Category,
  type CategoryTree,
  type GameConfig,
  type OnlinePlayer,
  type Session,
  SessionMode,
} from '@cityborn/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import IconButton from '../ui/buttons/IconButton';
import LoadingButton from '../ui/buttons/LoadingButton';

const flattenCategoryTree = (nodes: CategoryTree[]): Category[] =>
  nodes.flatMap((node) => [
    {
      id: node.id,
      name: node.name,
      isPublished: node.isPublished,
      description: node.description,
      parentId: node.parentId,
    },
    ...flattenCategoryTree(node.children),
  ]);

const toCategory = (node: CategoryTree): Category => ({
  id: node.id,
  name: node.name,
  isPublished: node.isPublished,
  description: node.description,
  parentId: node.parentId,
});

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
  categoryTrees,
  handleUpdateGameConfig,
  handleStartGame,
  handleJoinSession,
}: {
  localPlayerID: string | undefined;
  session: Session;
  categoryTrees: CategoryTree[];
  isHost: boolean;
  handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => Promise<void>;
  handleStartGame: () => Promise<void>;
  handleUpdateHost?: (newHostID: string) => Promise<void>;
  handleKickPlayer?: (playerToKick: string) => Promise<void>;
  handleJoinSession: (playerID: string) => Promise<void>;
}) => {
  const [copied, setCopied] = useState(false);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<CategoryTree[]>([]);
  const router = useRouter();
  const flatCategories = useMemo(
    () => flattenCategoryTree(categoryTrees),
    [categoryTrees],
  );
  useEffect(() => {
    if (
      flatCategories.length > 0 &&
      session.gameConfig.categories.length === 0 &&
      session.players.find((p) => p.username === localPlayerID)
    ) {
      handleUpdateGameConfig({ categories: flatCategories });
    }
  }, [
    flatCategories,
    session.gameConfig.categories.length,
    handleUpdateGameConfig,
    session.players,
    localPlayerID,
  ]);

  const currentCategoryNodes =
    selectedPath.length === 0
      ? categoryTrees
      : selectedPath[selectedPath.length - 1].children;

  const handlePlayCategory = async (node: CategoryTree) => {
    await handleUpdateGameConfig({ categories: [toCategory(node)] });
    await handleStartGame();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(session.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className={
            session.mode === SessionMode.SOLO
              ? 'flex flex-col items-center gap-2 p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[95%] min-w-80 sm:w-[70%] md:w-[55%] lg:max-w-xl max-h-[92%] overflow-y-auto pointer-events-auto'
              : 'flex flex-col items-center gap-2 p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[95%] min-w-80 sm:w-[85%] md:w-[75%] lg:max-w-3xl max-h-[92%] overflow-y-auto pointer-events-auto'
          }
        >
          <Typography variant="h5">{session.mode.toUpperCase()}</Typography>

          {session.mode === SessionMode.MULTI && (
            <div className="flex flex-col items-center justify-center w-[30%] min-w-40">
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

          <div className="flex flex-col sm:flex-row justify-start items-stretch gap-4 sm:gap-8 max-w-full w-full">
            {session.mode !== SessionMode.SOLO && (
              <List
                sx={{
                  flex: { xs: '1 1 auto', sm: '1 1 50%' },
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
                  ? (session.players as OnlinePlayer[]).sort((a, b) =>
                      a.connected === b.connected ? 0 : a.connected ? -1 : 1,
                    )
                  : session.players
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

            <div
              className={
                session.mode === SessionMode.SOLO
                  ? 'w-full max-w-full sm:max-w-xl mx-auto flex flex-col gap-3'
                  : 'w-full sm:w-[300px] md:w-[400px] max-w-full sm:shrink-0 flex flex-col gap-3'
              }
            >
              <div className="flex items-center gap-1">
                {selectedPath.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={() => setSelectedPath((path) => path.slice(0, -1))}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography variant="subtitle1" noWrap>
                  {selectedPath.length === 0
                    ? 'Packs'
                    : selectedPath[selectedPath.length - 1].name}
                </Typography>
              </div>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  maxHeight: { xs: 400, md: 520 },
                  overflowY: 'auto',
                }}
              >
                {currentCategoryNodes.map((node) => (
                  <Box
                    key={node.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 3,
                      minHeight: 80,
                      px: 1,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-of-type': { borderBottom: 0 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1rem', md: '1.15rem' },
                        fontWeight: 500,
                        flex: 1,
                        minWidth: 0,
                        overflowWrap: 'break-word',
                      }}
                    >
                      {node.name}
                    </Typography>
                    <div className="flex flex-col gap-1 shrink-0">
                      <LoadingButton
                        size="small"
                        variant="contained"
                        disabled={session.hostID !== localPlayerID}
                        onClick={() => handlePlayCategory(node)}
                        sx={{ width: 96, fontSize: '0.7rem' }}
                      >
                        Jouer
                      </LoadingButton>
                      {node.children.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setSelectedPath((path) => [...path, node])
                          }
                          sx={{ width: 96, fontSize: '0.7rem' }}
                        >
                          Sous-packs
                        </Button>
                      )}
                    </div>
                  </Box>
                ))}
              </Box>
            </div>
          </div>

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
    </div>
  );
};
