'use client';

import type { Pack } from '@cityborn/api';
import { useState } from 'react';
import { selectPackImageUrl } from './packImageUrl';

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
    imageUrl: selectPackImageUrl({ image: pack.image, failedImageUrl }),
    showNeutralImage: () => setFailedImageUrl(pack.image),
  };
}
