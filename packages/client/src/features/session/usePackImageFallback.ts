'use client';

import type { Pack } from '@cityborn/api';
import { useState } from 'react';

export type PackImageFallbackOptions = {
  pack: Pack;
};

export type PackImageFallback = {
  imageUrl: string | undefined;
  showNeutralImage: () => void;
};

export function usePackImageFallback({
  pack,
}: PackImageFallbackOptions): PackImageFallback {
  const [failedImageUrl, setFailedImageUrl] = useState<string | undefined>(
    undefined,
  );

  return {
    imageUrl: pack.image === failedImageUrl ? undefined : pack.image,
    showNeutralImage: () => setFailedImageUrl(pack.image),
  };
}
