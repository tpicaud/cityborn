import { fileURLToPath } from 'node:url';
import { createReactTestConfig } from '../../scripts/react-tests.mts';

export default createReactTestConfig({
  alias: { '@': fileURLToPath(new URL('./src/', import.meta.url)) },
  uiDependencies: ['@mui/material'],
});
