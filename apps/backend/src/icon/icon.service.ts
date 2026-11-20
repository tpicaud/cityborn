import { Inject, Injectable } from '@nestjs/common';
import { ICON_PROVIDER, type IconProvider } from './providers/icon.provider';

@Injectable()
export class IconService {
  constructor(
    @Inject(ICON_PROVIDER) private readonly iconProvider: IconProvider,
  ) {}

  async findSvg(iconName: string): Promise<string | null> {
    return this.iconProvider.findSvg(iconName);
  }
}
