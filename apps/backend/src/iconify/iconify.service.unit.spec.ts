import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { IconifyService } from './iconify.service';

describe('IconifyService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findSvg', () => {
    it('fetches the SVG of an icon from its icon set', async () => {
      const svg: string = '<svg viewBox="0 0 24 24"><path d="M0 0h24"/></svg>';
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        status: 200,
      });
      response.text.mockResolvedValue(svg);
      const fetchSpy: jest.SpyInstance = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(response);
      const iconifyService: IconifyService = new IconifyService();

      const foundSvg: string | null = await iconifyService.findSvg(
        'boxicons:music-alt-filled',
      );

      expect(foundSvg).toBe(svg);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.iconify.design/boxicons/music-alt-filled.svg',
        expect.anything(),
      );
    });

    it('returns null for an unknown icon', async () => {
      const response: DeepMocked<Response> = createMock<Response>({
        ok: false,
        status: 404,
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const iconifyService: IconifyService = new IconifyService();

      const foundSvg: string | null =
        await iconifyService.findSvg('boxicons:unknown');

      expect(foundSvg).toBeNull();
    });

    it('throws when Iconify is unavailable', async () => {
      const response: DeepMocked<Response> = createMock<Response>({
        ok: false,
        status: 503,
        statusText: 'Unavailable',
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const iconifyService: IconifyService = new IconifyService();

      await expect(
        iconifyService.findSvg('boxicons:music-alt-filled'),
      ).rejects.toThrow('Iconify icon fetch failed: Unavailable');
    });
  });
});
