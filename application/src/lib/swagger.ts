const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Next.js Game API",
        version: "1.0.0",
        description: "API pour gérer les parties multijoueurs",
    },
    servers: [
        {
            url: "http://localhost:3000/api",
            description: "Serveur local",
        },
    ],
    components: {
        schemas: {
            GameMode: {
                type: "string",
                enum: ["solo", "multi"],
                description: "Mode de jeu, soit en solo, soit en multijoueur",
            },
            Categories: {
                type: "string",
                enum: ["all", "Sport", "Cinema/Humour", "Musique", "Politique", "Autre domaine"],
                description: "Catégorie de l'objet à deviner, avec plusieurs options disponibles",
            },
            GameStatus: {
                type: "string",
                enum: ["LOBBY", "IN_PROGRESS", "RESULTS", "FINISHED"],
                description: "Statut actuel du jeu, représentant les différentes étapes du jeu",
            },
            RoundStatus: {
                type: "string",
                enum: ["GUESSING", "HAS_GUESSED", "SHOWING_RESULTS"],
                description: "Statut actuel du round, représentant les différentes étapes de la phase de supposition",
            },
            Coord: {
                type: "object",
                properties: {
                    lat: { type: "number", description: "Latitude" },
                    lng: { type: "number", description: "Longitude" },
                },
                required: ["lat", "lng"],
            },
            Guess: {
                type: "object",
                properties: {
                    coordinates: { $ref: "#/components/schemas/Coord" },
                    distance: { type: "number", description: "Distance entre la supposition et la cible" },
                    points: { type: "number", description: "Points attribués pour cette supposition" },
                    win: { type: "boolean", description: "Indique si la supposition est gagnante" },
                },
                required: ["coordinates", "distance", "points", "win"],
            },
            GuessObject: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Nom de l'objet à deviner" },
                    category: { type: "string", description: "Catégorie de l'objet" },
                    description: { type: "string", description: "Description détaillée de l'objet" },
                    short_description: { type: "string", description: "Brève description de l'objet" },
                    image: { type: "string", description: "URL de l'image représentant l'objet" },
                    answer: {
                        type: "object",
                        properties: {
                            place_name: { type: "string", description: "Nom du lieu correspondant à la réponse" },
                            coordinates: {
                                type: "object",
                                properties: {
                                    type: { type: "string", description: "Type de coordonnées (ex: 'Point')" },
                                    value: { type: "object", description: "Valeur des coordonnées sous un format spécifique" }
                                },
                                required: ["type", "value"]
                            }
                        },
                        required: ["place_name", "coordinates"]
                    }
                },
                required: ["name", "category", "description", "short_description", "image", "answer"]
            },
            Result: {
                type: "object",
                properties: {
                    guessObject: { $ref: "#/components/schemas/GuessObject" },
                    distance: { type: "number", description: "Distance entre la supposition et la réponse correcte" },
                    points: { type: "number", description: "Points attribués pour la supposition" },
                },
                required: ["guessObject", "distance", "points"],
            },
            Round: {
                type: "object",
                properties: {
                    status: { $ref: "#/components/schemas/RoundStatus" },
                    guessObject: { $ref: "#/components/schemas/GuessObject" },
                    playersGuesses: {
                        type: "object",
                        additionalProperties: { $ref: "#/components/schemas/Guess" },
                        description: "Les suppositions des joueurs, indexées par leur ID",
                    },
                },
                required: ["status", "guessObject"],
            },
            Player: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Identifiant unique du joueur" },
                    results: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Result" },
                        description: "Liste des résultats du joueur pour chaque supposition",
                    },
                    connected: {
                        type: "boolean",
                        description: "Indique si le joueur est connecté",
                        default: true,
                    },
                },
                required: ["id", "results"],
            },
            GameConfig: {
                type: "object",
                properties: {
                    categories: { $ref: "#/components/schemas/Categories" },
                    timer: { type: "integer", description: "Durée du timer en secondes" },
                    nbOfObjects: { type: "integer", description: "Nombre d'objets à deviner" },
                },
                required: ["categories", "timer", "nbOfObjects"],
            },
            Game: {
                type: "object",
                properties: {
                    id: { type: "string", description: "Identifiant unique de la partie" },
                    mode: { $ref: "#/components/schemas/GameMode", description: "Mode de jeu" },
                    hostID: { type: "string", description: "ID de l'hôte" },
                    status: { $ref: "#/components/schemas/GameStatus", description: "Status de la partie" },
                    gameConfig: { $ref: "#/components/schemas/GameConfig" },
                    players: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Player" },
                        description: "Liste des joueurs dans la partie",
                    },
                    guessObjects: {
                        type: "array",
                        items: { $ref: "#/components/schemas/GuessObject" }
                    },
                    currentRound: {
                        $ref: "#/components/schemas/Round",
                        nullable: true,
                        description: "Round en cours, peut être null si la partie n'a pas commencé",
                    },
                },
            },
            Error: {
                type: "object",
                properties: {
                    message: { type: "string", description: "Message d'erreur" },
                },
            },
        },
    },
    paths: {
        "/game": {
            post: {
                summary: "Créer une nouvelle game",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    gameMode: { $ref: "#/components/schemas/GameMode" },
                                    gameConfig: { $ref: "#/components/schemas/GameConfig" },
                                    playerID: { type: "string" },

                                },
                                required: ["gameMode", "gameConfig", "playerID"],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Game créée",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        gameID: { type: "string" },
                                    },
                                },
                                example: {
                                    gameID: "12345",
                                },
                            },
                        },
                    },
                    400: {
                        description: "Données invalides",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Les données envoyées sont invalides",
                                },
                            },
                        },
                    },
                },
            },
            get: {
                summary: "Récupérer une partie par son ID",
                parameters: [
                    {
                        name: "id",
                        in: "query",
                        required: true,
                        description: "L'identifiant unique de la partie à récupérer",
                        schema: {
                            type: "string"
                        }
                    }
                ],
                responses: {
                    200: {
                        description: "Détails de la partie trouvée",
                        content: {
                            "application/json": {
                                example: {
                                    id: "defensive-silver-newt",
                                    mode: "multi",
                                    hostID: "",
                                    status: 1,
                                    gameConfig: {},
                                    players: [],
                                    currentRound: {},
                                    guessObjects: []
                                }
                            }
                        }
                    },
                    400: {
                        description: "Requête invalide (id manquant)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "L'identifiant de la game est requis."
                                }
                            }
                        }
                    },
                    404: {
                        description: "Aucune partie trouvée avec cet ID",
                        content: {
                            "application/json": {
                                example: {
                                    message: "Aucune game trouvée avec cet identifiant."
                                }
                            }
                        }
                    },
                    500: {
                        description: "Erreur interne du serveur",
                        content: {
                            "application/json": {
                                example: {
                                    message: "Erreur lors de la récupération de la game."
                                }
                            }
                        }
                    }
                }
            },            
            delete: {
                summary: "Supprimer une partie",
                parameters: [
                    {
                        name: "id",
                        in: "query",
                        required: true,
                        description: "L'identifiant unique de la partie à supprimer",
                        schema: {
                            type: "string"
                        }
                    }
                ],
                responses: {
                    200: {
                        description: "L'id de la partie supprimée",
                        content: {
                            "application/json": {
                                example: {
                                    message: "La partie {id} a été supprimée"
                                }
                            },
                        },
                    },
                    400: {
                        description: "Requête invalide (id manquant ou incorrect)",
                        content: {
                            "application/json": {
                                example: {
                                    message: "L'identifiant de la game est requis."
                                }
                            }
                        }
                    },
                    404: {
                        description: "Aucune partie trouvée avec cet ID",
                        content: {
                            "application/json": {
                                example: {
                                    message: "Aucune game trouvée avec cet identifiant."
                                }
                            }
                        }
                    },
                    500: {
                        description: "Erreur interne du serveur",
                        content: {
                            "application/json": {
                                example: {
                                    message: "Erreur lors de la suppression de la game."
                                }
                            }
                        }
                    }
                }
            }
        },
        "/game/{id}": {
            get: {
                summary: "Récupérer une partie par ID",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Identifiant de la partie à récupérer",
                    },
                ],
                responses: {
                    200: {
                        description: "Partie trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Game" },
                            },
                        },
                    },
                    404: {
                        description: "Partie non trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Partie introuvable",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/game/{id}/start": {
            post: {
                summary: "Démarrer la partie",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Identifiant de la partie à récupérer",
                    },
                ],
                responses: {
                    200: {
                        description: "La partie a commencé",
                    },
                    404: {
                        description: "Partie non trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Partie introuvable",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/game/{id}/guess": {
            post: {
                summary: "Poster un guess",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Identifiant de la partie à récupérer",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    playerID: { type: "string" },
                                    guess: { $ref: "#/components/schemas/Guess" },
                                },
                                required: ["playerID", "guess"],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Partie trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Game" },
                            },
                        },
                    },
                    404: {
                        description: "Partie non trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Partie introuvable",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/game/{id}/nextRound": {
            put: {
                summary: "Aller au round suivant",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "Identifiant de la partie à récupérer",
                    },
                ],
                responses: {
                    200: {
                        description: "Passage au round suivant effectué",
                    },
                    404: {
                        description: "Partie non trouvée",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Partie introuvable",
                                },
                            },
                        },
                    },
                },
            },
        },
        "/game/join": {
            put: {
                summary: "Rejoindre une game",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    gameID: { type: "string" },
                                    playerID: { type: "string" },
                                },
                                required: ["gameID", "playerID"],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Joueur ajouté à la game",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        gameID: { type: "string" },
                                        players: {
                                            type: "array",
                                            items: { type: "string" },
                                        },
                                    },
                                },
                                example: {
                                    gameID: "12345",
                                    players: ["host123", "player456"],
                                },
                            },
                        },
                    },
                    400: {
                        description: "Données invalides",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Error" },
                                example: {
                                    message: "Impossible de rejoindre la game, ID invalide",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export default swaggerDefinition;