const { withDangerousMod } = require('@expo/config-plugins');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      );
      let contents = readFileSync(podfilePath, 'utf8');

      if (
        !contents.includes("pod 'GoogleUtilities', :modular_headers => true")
      ) {
        contents = contents.replace(
          '  use_react_native!(',
          "  pod 'GoogleUtilities', :modular_headers => true\n  pod 'RecaptchaInterop', :modular_headers => true\n\n  use_react_native!(",
        );
        writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
};
