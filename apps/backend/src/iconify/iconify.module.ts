import { Module } from '@nestjs/common';
import { IconifyService } from './iconify.service';

@Module({
  providers: [IconifyService],
  exports: [IconifyService],
})
export class IconifyModule {}
