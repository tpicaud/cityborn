import { Card, CardContent, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Accordion, AccordionDetails, AccordionSummary, Checkbox, FormControl, InputLabel, MenuItem, OutlinedInput, Select } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from "react";
import { GameMode, Session } from "@cityborn/types";
import { GameConfig } from "@cityborn/types";
import { Categories } from "@cityborn/types";
import { OnlinePlayer } from "@cityborn/types";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const LobbyComponent = ({ localPlayerID, isHost, session, handleUpdateHost, handleUpdateGameConfig, handleKickPlayer, handleStartGame }: {
    localPlayerID: string | undefined;
    session: Session;
    isHost: boolean;
    handleUpdateGameConfig: (gameConfig: Partial<GameConfig>) => void;
    handleStartGame: () => Promise<void>;
    handleUpdateHost?: (newHostID: string) => void;
    handleKickPlayer?: (playerToKick: string) => void;
}) => {
    const [copied, setCopied] = useState(false);
    const [tempNbOfObjects, setTempNbOfObjects] = useState(session.gameConfig.nbOfObjects.toString());
    const [tempTimer, setTempTimer] = useState<string>(session.gameConfig.timer.toString());
    const router = useRouter();


    const handleCopy = () => {
        navigator.clipboard.writeText(session.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Réinitialise le message après 2 secondes
    };

    return (
        <Card sx={{ maxWidth: 400, margin: "auto", mt: 4, p: 2 }}>
            <CardContent>
                {session.mode === GameMode.MULTI && (
                    <>
                        {/* Champ pour afficher et copier l'ID du jeu */}
                        < Typography variant="subtitle1" gutterBottom>
                            Code de la partie :
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
                    </>
                )}

                {/* Titre du lobby */}
                <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                    Lobby - {session.mode}
                </Typography>

                {/* Liste des joueurs */}
                {session.mode !== GameMode.SOLO && (
                    <List>
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
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={session.hostID !== localPlayerID}
                    onClick={handleStartGame}
                >
                    Démarrer la partie
                </Button>

                {/* Menu */}
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={session.hostID !== localPlayerID}
                    onClick={() => router.push('/')}
                >
                    Menu
                </Button>
            </CardContent>
        </Card >
    );
};
