import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GuessObjectService } from '../guess-object.service';
import { GuessObjectsResponseDto } from '../dto/guess-object.response.dto';
import {
  CreateGuessObjectDto,
  CreateGuessObjectResponseDto,
} from '../dto/create-guess-object.dto';
import { ErrorCode } from '@cityborn/errors';
import { GuessObjectDto } from '../dto/guess-object.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@UseGuards(AdminGuard)
@Controller('admin/guess-objects')
export class AdminGuessObjectController {
  private readonly logger = new Logger(AdminGuessObjectController.name);

  constructor(private readonly guessObjectsService: GuessObjectService) {}

  @Get()
  async getGuessObjectsFromIds(
    @Query('guessObjectsIds') guessObjectsIds: string | string[],
  ): Promise<GuessObjectsResponseDto> {
    const idsArray = Array.isArray(guessObjectsIds)
      ? guessObjectsIds
      : guessObjectsIds.split(',');

    return {
      guessObjects: await this.guessObjectsService.findSome(idsArray),
    };
  }

  @Get(':id')
  async getGuessObject(
    @Param('id') id: string,
    @Query('include') include?: string,
  ): Promise<GuessObjectDto> {
    let includes: string[];
    try {
      includes = include ? include.split(',').map((i) => i.trim()) : [];
    } catch {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: 'Bad query',
      });
    }
    return await this.guessObjectsService.findById(id, includes);
  }

  @Patch(':id')
  async patchGuessObject(
    @Param('id') id: string,
    @Body() updatedFields: Partial<GuessObjectDto>,
  ): Promise<{ id: string }> {
    return {
      id: await this.guessObjectsService.update(id, updatedFields),
    };
  }

  @Post()
  async createGuessObject(
    @Body() createGuessObjectDto: CreateGuessObjectDto,
  ): Promise<CreateGuessObjectResponseDto> {
    return {
      id: await this.guessObjectsService.create(createGuessObjectDto),
    };
  }

  @Delete(':id')
  async deleteGuessObjects(@Param('id') id: string): Promise<void> {
    await this.guessObjectsService.delete(id);
  }
}
