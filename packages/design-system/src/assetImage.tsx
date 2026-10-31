import { type ComponentType, createContext, type ReactNode, use } from 'react';

export type CommonIcon = 'back' | 'close' | 'options';

export type TabIcon = 'home' | 'collection' | 'social' | 'profile';

export type ImageAsset =
  | `common/${CommonIcon}`
  | `navigation/${TabIcon}`
  | `navigation/${TabIcon}-pressed`
  | 'backgrounds/phone'
  | 'backgrounds/tablet'
  | 'monogram';

export type AssetImageProps = {
  asset: ImageAsset;
};

type AssetImage = ComponentType<AssetImageProps>;

const AssetImageContext = createContext<AssetImage | null>(null);

type AssetImageProviderProps = {
  image: AssetImage;
  children: ReactNode;
};

export function AssetImageProvider({
  image,
  children,
}: AssetImageProviderProps) {
  return <AssetImageContext value={image}>{children}</AssetImageContext>;
}

export function useAssetImage(): AssetImage {
  const image: AssetImage | null = use(AssetImageContext);
  if (!image) {
    throw new Error('AssetImageProvider is missing');
  }
  return image;
}
