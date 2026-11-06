import type { TamaguiBuildOptions } from '@tamagui/core';

export default {
  components: ['tamagui', '@cityborn/design-system'],
  config: '../../packages/design-system/tamagui.config.ts',
  outputCSS: './public/tamagui.generated.css',
} satisfies TamaguiBuildOptions;
