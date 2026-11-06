import type { TamaguiBuildOptions } from '@tamagui/core';

export default {
  components: ['tamagui', '@cityborn/design-system'],
  config: '../../packages/design-system/tamagui.config.ts',
  disable: true,
} satisfies TamaguiBuildOptions;
