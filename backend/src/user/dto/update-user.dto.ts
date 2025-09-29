import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { MinLength } from 'class-validator';
import { UUID } from 'node:crypto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @MinLength(3)
  full_name?: string;

  @MinLength(3)
  username?: string;

  avatar_url?: string;

  premium_account?: UUID;
}
