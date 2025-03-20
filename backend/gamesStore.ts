// Liste des parties en mémoire
let games: any[] = [];

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
        games[index] = updatedGame;
    }
}

// Exporter la liste des parties (optionnel, pour debug)
export function getAllGames() {
    return games;
}
