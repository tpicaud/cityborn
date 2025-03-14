import Game from "@/types/Game";
import { Card, CardContent, Typography, List, ListItem, ListItemText, Button } from "@mui/material";

export const LobbyComponent = ({ game, startGame }: { game: Game, startGame: () => void }) => {


    return (
<Card sx={{ maxWidth: 400, margin: "auto", mt: 4, p: 2 }}>
    <CardContent>
        <Typography variant="h5" gutterBottom>
            Lobby - {game.mode}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
            Joueurs connectés : {game.players.length}
        </Typography>
        <List>
            {game.players
                .sort((a, b) => (a.connected === b.connected ? 0 : a.connected ? -1 : 1)) // Trier les joueurs
                .map((player) => (
                    <ListItem key={player.id} divider>
                        <ListItemText
                            primary={`Joueur: ${player.id}`}
                            secondary={player.connected ? "Connecté" : "Déconnecté"}
                            sx={{
                                color: player.connected ? 'text.primary' : 'text.disabled', // Applique gris si déconnecté
                            }}
                        />
                    </ListItem>
                ))}
        </List>
        <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={game.players.length < 2}
            onClick={startGame}
        >
            Démarrer la partie
        </Button>
    </CardContent>
</Card>


    );
}