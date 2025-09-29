import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
  Query,
  Redirect,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UUID } from 'node:crypto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    if (!id) throw new BadRequestException('Provide user id to fetch user');

    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: UUID,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ) {
    if (!id) throw new BadRequestException('Provide user id to update user');

    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: UUID) {
    if (!id) throw new BadRequestException('Provide user id to delete user');

    return this.userService.remove(id);
  }

  @Get('googleauth')
  @Redirect()
  googleAuth(@Query('code') code: string, @Query('next') next: string) {
    return this.userService.googleAuth(code, next);
  }
}
