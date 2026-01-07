const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
console.log(process.env.EXPO_NO_DOTENV);
console.log(process.env.APP_VARIANT);

module.exports = withNativewind(config);
