import { fileURLToPath } from 'node:url';
import { createReactTestConfig } from '../../scripts/react-tests.mts';

export default createReactTestConfig({
  sourceDirectory: '',
  alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  uiDependencies: ['@ariakit/react', 'lucide-react'],
});
