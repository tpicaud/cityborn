import { type ComponentType, createContext, type ReactNode, use } from 'react';

export type CommonIcon = 'back' | 'close' | 'options';

export type CommonIconImageProps = {
  icon: CommonIcon;
  width: number;
  height: number;
};

type CommonIconImage = ComponentType<CommonIconImageProps>;

const CommonIconImageContext = createContext<CommonIconImage | null>(null);

type CommonIconsProviderProps = {
  image: CommonIconImage;
  children: ReactNode;
};

export function CommonIconsProvider({
  image,
  children,
}: CommonIconsProviderProps) {
  return (
    <CommonIconImageContext value={image}>{children}</CommonIconImageContext>
  );
}

export function useCommonIconImage(): CommonIconImage {
  const image: CommonIconImage | null = use(CommonIconImageContext);
  if (!image) {
    throw new Error('CommonIconsProvider is missing');
  }
  return image;
}
