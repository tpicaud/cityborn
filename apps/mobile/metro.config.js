const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const { withTamagui } = require('@tamagui/cli/metro');
const path = require('node:path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.resetCache = true;

// Only watch what the mobile app actually needs — avoids scanning Docker volumes
// owned by root (e.g. apps/backend/docker-data) which crash the FallbackWatcher.
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const nativewindConfig = withNativewind(withTamagui(config));
const resolveWithNativewind = nativewindConfig.resolver.resolveRequest;
const tamaguiPackagesPath = `${path.sep}node_modules${path.sep}@tamagui${path.sep}`;

nativewindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native' &&
    context.originModulePath.includes(tamaguiPackagesPath)
  ) {
    return context.resolveRequest(context, moduleName, platform);
  }

  return resolveWithNativewind(context, moduleName, platform);
};

module.exports = nativewindConfig;
