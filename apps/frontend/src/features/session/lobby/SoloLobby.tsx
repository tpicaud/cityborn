'use client';

import type { Pack } from '@cityborn/api';
import { PackCatalog } from '../PackCatalog';

type SoloLobbyProps = {
  handlePlayPack: (pack: Pack) => Promise<void>;
};

export function SoloLobby({ handlePlayPack }: SoloLobbyProps) {
  return <PackCatalog onPlay={handlePlayPack} bottomSafeArea />;
}
