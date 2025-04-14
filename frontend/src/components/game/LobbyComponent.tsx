import Game from "@/types/Game";
import { Card, CardContent, Typography, List, ListItem, ListItemText, Button, TextField, IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useState } from "react";

export const LobbyComponent = ({
    localPlayerID,
    game,
    startGame
}: {
    localPlayerID: string | null,
    game: Game;
    startGame: () => void
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(game.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Réinitialise le message après 2 secondes
    };

    return (
            <Card sx={{ maxWidth: 400, margin: "auto", mt: 4, p: 2 }}>
                <CardContent>
                    {/* Champ pour afficher et copier l'ID du jeu */}
                    <Typography variant="subtitle1" gutterBottom>
                        Code de la partie :
                    </Typography>
                    <TextField
                        fullWidth
                        value={game.id}
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

                    {/* Titre du lobby */}
                    <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
                        Lobby - Multijoueur
                    </Typography>

                    {/* Liste des joueurs */}
                    <List>
                        {game.players
                            .sort((a, b) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1)) // Trier les joueurs
                            .map((player) => (
                                <ListItem key={player.id} divider>
                                    <ListItemText
                                        primary={
                                            player.id === game.hostID
                                                ? `${player.id} (Host)`
                                                : `${player.id}`
                                        }
                                        secondary={player.connected ? "Connecté" : "Déconnecté"}
                                        sx={{
                                            color: player.connected ? "text.primary" : "text.disabled", // Applique gris si déconnecté
                                        }}
                                    />
                                </ListItem>
                            ))}
                    </List>

                    {/* Bouton pour démarrer la partie */}
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                        disabled={game.hostID !== localPlayerID}
                        onClick={startGame}
                    >
                        Démarrer la partie
                    </Button>
                </CardContent>
            </Card>
    );
};
