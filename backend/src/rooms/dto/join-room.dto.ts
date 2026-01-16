import { UserType } from 'src/user/entities/user.entity';
import { Room } from './room.dto';

export class JoinRoomDto extends Room {
  roomId?: string;
  joinee: UserType;
}
