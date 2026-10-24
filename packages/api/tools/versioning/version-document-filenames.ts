export function versionDocumentFilenames(versionNumber: number): {
  http: string;
  ws: string;
} {
  return {
    http: `v${versionNumber}-api.json`,
    ws: `v${versionNumber}-ws.json`,
  };
}
