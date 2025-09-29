import { MinLength } from 'class-validator';
import { UUID } from 'node:crypto';

export class CreateUserDto {
  @MinLength(3)
  full_name: string;

  @MinLength(3)
  username: string;

  avatar_url: string;

  premium_account: UUID;
}
