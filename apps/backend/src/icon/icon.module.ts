import { Module } from '@nestjs/common';
import { IconService } from './icon.service';
import { ICON_PROVIDER } from './providers/icon.provider';
import { IconifyIconProvider } from './providers/iconify-icon.provider';

@Module({
  providers: [
    IconService,
    { provide: ICON_PROVIDER, useClass: IconifyIconProvider },
  ],
  exports: [IconService],
})
export class IconModule {}
