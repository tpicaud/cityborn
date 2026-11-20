import { Injectable } from '@nestjs/common';
import { USER_AGENT } from '../../common/constants';
import type { IconProvider } from './icon.provider';

@Injectable()
export class IconifyIconProvider implements IconProvider {
  private readonly ICONIFY_API_URL = 'https://api.iconify.design';

  async findSvg(iconName: string): Promise<string | null> {
    const response: Response = await fetch(
      `${this.ICONIFY_API_URL}/${iconName.replace(':', '/')}.svg`,
      { headers: { 'User-Agent': USER_AGENT } },
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Iconify icon fetch failed: ${response.statusText}`);
    }

    return response.text();
  }
}
