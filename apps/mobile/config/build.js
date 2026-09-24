const { z } = require('zod');

const mobileBuildConfigSchema = z.object({
  appVariant: z.enum(['development', 'preview', 'staging', 'production']),
  googleMapsAndroidApiKey: z.string().trim().min(1),
  googleMapsIosApiKey: z.string().trim().min(1),
});

const mobileBuildConfig = mobileBuildConfigSchema.parse({
  appVariant: process.env.APP_VARIANT,
  googleMapsAndroidApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
  googleMapsIosApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
});

module.exports = { mobileBuildConfig };
