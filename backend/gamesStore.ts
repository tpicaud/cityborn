// Liste des parties en mémoire
let games: any[] = [];

// Seuil d'inactivité d'une partie
const INACTIVITY_LIMIT = 1 * 60 * 1000; // 5 minutes en millisecondes

// Nettoyage des parties inactives
setInterval(() => {
    const now = Date.now();
    const removedGames = games.filter(game => now - game.lastActivity >= INACTIVITY_LIMIT);
    games = games.filter(game => now - game.lastActivity < INACTIVITY_LIMIT);
    
    if (removedGames.length > 0) {
        console.log('Removed inactive games:', removedGames.map(game => game.id));
    }
    console.log('Current active games:', games.length);
}, 60 * 1000); // Vérification toutes les minutes


// Ajouter une partie
export function addGame(game: any) {
    games.push(game);
}

// Récupérer une partie
export function getGame(gameID: string) {
    return games.find(game => game.id === gameID);
}

// Supprimer une partie
export function removeGame(gameID: string) {
    games = games.filter(game => game.id !== gameID);
}

// Mettre à jour une partie
export function updateGame(updatedGame: any) {
    const index = games.findIndex(game => game.id === updatedGame.id);
    if (index !== -1) {
        updatedGame.lastActivity = Date.now()
        games[index] = updatedGame;
    }
}

// Exporter la liste des parties (optionnel, pour debug)
export function getAllGames() {
    return games;
}