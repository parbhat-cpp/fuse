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
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UUID } from 'node:crypto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: UUID) {
    if (!id) throw new BadRequestException('Provide user id to fetch user');

    return this.userService.findOne(id);
  }

  @Patch()
  @UseGuards(AuthGuard)
  update(
    @Req() request: Request,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
  ) {
    const userId = request['user'].sub;

    if (!userId)
      throw new BadRequestException('Provide user id to update user');

    return this.userService.update(userId, updateUserDto);
  }

  @Delete()
  @UseGuards(AuthGuard)
  remove(@Req() request: Request) {
    const userId = request['user'].sub;

    if (!userId)
      throw new BadRequestException('Provide user id to delete user');

    return this.userService.remove(userId);
  }
}
