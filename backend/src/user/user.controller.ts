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
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UUID } from 'node:crypto';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    if (!id) throw new BadRequestException('Provide user id to fetch user');

    return this.userService.findOne(id);
  }

  @Patch()
  update(
    @Req() request: Request,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ) {
    const userId = request.headers['X-User-Id'] as string as UUID;

    if (!userId)
      throw new BadRequestException('Provide user id to update user');

    return this.userService.update(userId, updateUserDto);
  }

  @Delete()
  remove(@Req() request: Request) {
    const userId = request.headers['X-User-Id'] as string as UUID;

    if (!userId)
      throw new BadRequestException('Provide user id to delete user');

    return this.userService.remove(userId);
  }
}
