export const ICON_PROVIDER = Symbol('ICON_PROVIDER');

export interface IconProvider {
  findSvg(iconName: string): Promise<string | null>;
}
