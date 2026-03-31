import { MinLength } from 'class-validator';

export class CreateUserDto {
  @MinLength(3)
  full_name: string;

  @MinLength(3)
  username: string;

  avatar_url: string;
}
