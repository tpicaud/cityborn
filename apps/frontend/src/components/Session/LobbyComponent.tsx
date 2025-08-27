'use client';

import { Typography, List, ListItem, ListItemText, TextField, Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControl, InputLabel, MenuItem, OutlinedInput, Select, Box, Dialog, DialogTitle, DialogContent } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from "react";
import { GameMode, Session } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { Categories } from "@cityborn/types";
import { OnlinePlayer } from "@cityborn/types";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DialogInput } from "../others/DialogInput";
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import IconButton from "../ui/buttons/IconButton";
import LoadingButton from "../ui/buttons/LoadingButton";
import Button from "../ui/buttons/Button";

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LobbyComponent = ({ localPlayerID, isHost, session, handleUpdateHost, handleUpdateGameConfig, handleKickPlayer, handleStartGame, handleJoinSession }: {
    localPlayerID: string | undefined;
    session: Session;
    isHost: boolean;
    handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    handleStartGame: () => Promise<void>;
    handleUpdateHost?: (newHostID: string) => void;
    handleKickPlayer?: (playerToKick: string) => void;
    handleJoinSession: (playerID: string) => void;
}) => {
    const [copied, setCopied] = useState(false);
    const [tempNbOfObjects, setTempNbOfObjects] = useState(session.gameConfig.nbOfObjects.toString());
    const [tempTimer, setTempTimer] = useState<string>(session.gameConfig.timer.toString());
    const [currentInput, setCurrentInput] = useState<string>('');
    const router = useRouter();

    const handleCopy = () => {
        navigator.clipboard.writeText(session.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Réinitialise le message après 2 secondes
    };

    return (
        <div className="relative h-screen overflow-hidden">
            <div className="absolute inset-0">
                <MapContainer center={[0, 0]} zoom={3} zoomControl={false} className="h-full w-full z-0">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </MapContainer>
                <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center bg-transparent h-full pointer-events-none">
                <Box className="flex flex-col items-center gap-2 p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[50%] min-w-80 max-h-[80%] pointer-events-auto">
                    {/* Titre du lobby */}
                    <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                        {session.mode.toUpperCase()}
                    </Typography>

                    {session.mode === GameMode.MULTI && (
                        <div className="flex flex-col items-center justify-center w-[30%] min-w-40">
                            {/* Champ pour afficher et copier l'ID du jeu */}
                            < Typography variant="subtitle1" gutterBottom>
                                Code
                            </Typography>
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
                                    }
                                }}
                            />

                            {copied && (
                                <Typography variant="caption" color="success.main">
                                    Copié !
                                </Typography>
                            )}
                        </div>
                    )}

                    {/* Liste des joueurs */}
                    {session.mode !== GameMode.SOLO && (
                        <List className="w-full min-h-[10vh] max-h-[30vh] overflow-auto">
                            {(session.players.every(p => "connected" in p)
                                ? // Tous sont des OnlinePlayer → trier + statut
                                (session.players as OnlinePlayer[])
                                    .sort((a, b) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1))
                                : // Sinon, pas de tri
                                session.players
                            ).map((player) => (
                                <ListItem key={player.id} divider>
                                    <ListItemText
                                        primary={
                                            player.id === session.hostID
                                                ? `${player.id} (Host)`
                                                : `${player.id}`
                                        }
                                        secondary={
                                            "connected" in player
                                                ? (player as OnlinePlayer).connected
                                                    ? "Connecté"
                                                    : "Déconnecté"
                                                : undefined
                                        }
                                        sx={{
                                            color:
                                                "connected" in player && !(player as OnlinePlayer).connected
                                                    ? "text.disabled"
                                                    : "text.primary",
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <div className='max-w-full'>
                        <Accordion
                            defaultExpanded={session.mode === GameMode.SOLO}
                            sx={{
                                borderTop: '1px solid #ccc',  // Bordure grise
                                backgroundColor: 'transparent',  // Fond transparent
                                boxShadow: 'none',  // Pas d'ombre
                                '&:before': {
                                    display: 'none',  // Enlève la ligne avant l'accordion
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                disabled={!isHost}
                                sx={{
                                    backgroundColor: 'transparent',  // Fond transparent pour l'en-tête
                                    border: 'none',
                                    paddingBottom: 0,
                                    marginBottom: 0
                                }}
                            >
                                <Typography component="span">Configuration de la partie</Typography>
                            </AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    backgroundColor: 'transparent',
                                    paddingTop: 0,
                                    marginTop: 0
                                }}
                            >
                                <div className='w-full flex flex-col gap-3'>
                                    <FormControl sx={{ width: '100%' }}>
                                        <InputLabel id="categories-input">Categories</InputLabel>
                                        <Select
                                            labelId="categories-input"
                                            id="categories-input"
                                            multiple
                                            value={session.gameConfig.categories}
                                            onChange={(e) => handleUpdateGameConfig({ categories: e.target.value as Categories[] })}
                                            input={<OutlinedInput label="Categories" />}
                                            renderValue={(selected) => (selected as string[]).join(', ')}
                                        >
                                            {Object.values(Categories).map((category) => (
                                                <MenuItem key={category} value={category}>
                                                    <Checkbox checked={session.gameConfig.categories.includes(category)} />
                                                    <ListItemText primary={category} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <div className='w-full flex flex-row gap-x-2'>
                                        <TextField
                                            type="number"
                                            label="Personnalités"
                                            variant="outlined"
                                            fullWidth
                                            value={tempNbOfObjects}
                                            onChange={(e) => {
                                                setTempNbOfObjects(e.target.value); // on garde la valeur saisie, même vide
                                            }}
                                            onBlur={() => {
                                                const parsed = parseInt(tempNbOfObjects, 10);
                                                if (isNaN(parsed) || parsed <= 0) {
                                                    handleUpdateGameConfig({ nbOfObjects: 6 });
                                                    setTempNbOfObjects('6'); // on remet aussi le champ visuel à jour
                                                } else {
                                                    handleUpdateGameConfig({ nbOfObjects: parsed });
                                                }
                                            }}
                                        />


                                        <TextField
                                            type="number"
                                            label="Timer"
                                            variant="outlined"
                                            fullWidth
                                            value={tempTimer}
                                            onChange={(e) => {
                                                setTempTimer(e.target.value); // on laisse l'utilisateur taper librement
                                            }}
                                            onBlur={() => {
                                                const parsed = parseInt(tempTimer, 10);
                                                if (isNaN(parsed) || parsed <= 0) {
                                                    handleUpdateGameConfig({ timer: 20 });
                                                    setTempTimer('20');
                                                } else {
                                                    handleUpdateGameConfig({ timer: parsed });
                                                }
                                            }}
                                        />

                                    </div>

                                </div>
                            </AccordionDetails>
                        </Accordion>
                    </div>

                    {/* Bouton pour démarrer la partie */}
                    <LoadingButton
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={session.hostID !== localPlayerID}
                        onClick={handleStartGame}
                    >
                        Démarrer la partie
                    </LoadingButton>

                    {/* Menu */}
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={session.hostID !== localPlayerID}
                        onClick={() => router.push('/')}
                    >
                        Menu
                    </Button>
                </Box >
            </div>

            <Dialog
                open={!localPlayerID}
            >
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
                        disabled={currentInput.trim() === ""}
                        onClick={() => handleJoinSession(currentInput)}
                    >
                        <ArrowCircleRightIcon />
                    </LoadingButton>
                </DialogContent>
            </Dialog>
            {!localPlayerID && (
                <DialogInput message='Entrez votre pseudo' handleClick={handleJoinSession} label='Votre pseudo' />
            )}
        </div >
    );
};
