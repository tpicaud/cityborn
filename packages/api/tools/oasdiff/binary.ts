import { fileURLToPath } from 'node:url';

export const oasdiffVersion: string = '1.26.1';
export const oasdiffBinary: string = fileURLToPath(
  new URL(
    `../../node_modules/.cache/oasdiff/${oasdiffVersion}/${process.platform}-${process.arch}/oasdiff${process.platform === 'win32' ? '.exe' : ''}`,
    import.meta.url,
  ),
);
