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
                                    hostID: { type: "string" },
                                    gameMode: { type: "string" },
                                    gameConfig: { type: "object" },
                                },
                                required: ["hostID", "gameMode", "gameConfig"],
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Game créée" },
                    400: { description: "Données invalides" },
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
                    200: { description: "Joueur ajouté" },
                    400: { description: "Données invalides" },
                },
            },
        },
    },
};

export default swaggerDefinition;
