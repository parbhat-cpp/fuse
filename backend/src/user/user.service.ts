import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UUID } from 'node:crypto';
import { supabase } from 'src/supabase';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly request: Request,
  ) { }

  /**
   * Fetch user by ID
   * @param id - User ID
   * @returns {Promise<User>} Returns User data
   */
  async findOne(id: UUID): Promise<User> {
    const user = await this.usersRepository.findOneBy({
      id: id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Updates user data by ID
   * @param id - User ID
   * @param updateUserDto - User data to be updates
   * @returns {Promise<User>} - Returns updated user data
   */
  async update(id: UUID, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({
      id: id,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.username) {
      const usernameExists = await this.usersRepository.findOneBy({
        username: updateUserDto.username,
      });

      if (usernameExists) {
        throw new ConflictException('Username already taken');
      }
    }

    await this.usersRepository.update(
      {
        id: id,
      },
      updateUserDto,
    );

    const updatedUser = await this.usersRepository.findOneBy({
      id: id,
    });

    return updatedUser;
  }

  /**
   * Deletes User by ID
   * @param id - User ID
   * @returns {Promise<string>} Returns deleted user data
   */
  async remove(id: UUID): Promise<string> {
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', `${id}`);

    if (profileError) {
      throw new HttpException(
        `Error deleting profile: ${profileError.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Delete from authentication (Admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(`${id}`);

    if (authError) {
      throw new HttpException(
        `Error deleting user from auth: ${authError.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return 'User deleted';
  }

  async googleAuth(code: string, next: string) {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      Logger.debug(data);

      if (!error) {
        return { url: `${process.env.CLIENT_URL}?googleauth=success`, statusCode: HttpStatus.TEMPORARY_REDIRECT };
      } else {
        return { url: `${process.env.CLIENT_URL}?googleauth=failed`, statusCode: HttpStatus.TEMPORARY_REDIRECT };
      }
    }
    return { url: `${process.env.CLIENT_URL}?googleauth=failed`, statusCode: HttpStatus.TEMPORARY_REDIRECT };
  }
}
