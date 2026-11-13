'use client';

import type { Pack } from '@cityborn/api';
import {
  type PackImageFallback,
  usePackImageFallback,
} from '@cityborn/client/session';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import Image from 'next/image';

const packVisualSize: number = 56;

export function PackVisual({ pack }: { pack: Pack }) {
  const { imageUrl, showNeutralImage }: PackImageFallback =
    usePackImageFallback({ pack });

  if (!imageUrl) {
    return (
      <div
        aria-hidden="true"
        className="flex size-14 shrink-0 items-center justify-center rounded-md bg-slate-300 text-slate-500"
      >
        <ImageOutlinedIcon />
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt=""
      width={packVisualSize}
      height={packVisualSize}
      onError={showNeutralImage}
      className="size-14 shrink-0 rounded-md object-cover"
    />
  );
}
