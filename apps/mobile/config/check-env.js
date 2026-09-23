require('dotenv').config();
require('./build');
const { z } = require('zod');

const mobileClientEnvironmentSchema = z.object({
  restBackendUrl: z.string().url(),
  websocketBackendUrl: z.string().url(),
  googleOAuthWebClientId: z.string().trim().min(1),
  googleOAuthIosClientId: z.string().trim().min(1),
});

mobileClientEnvironmentSchema.parse({
  restBackendUrl: process.env.EXPO_PUBLIC_REST_BACKEND_URL,
  websocketBackendUrl: process.env.EXPO_PUBLIC_WEBSOCKET_BACKEND_URL,
  googleOAuthWebClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID,
  googleOAuthIosClientId: process.env.EXPO_PUBLIC_GOOGLE_OAUTH_IOS_CLIENT_ID,
});
