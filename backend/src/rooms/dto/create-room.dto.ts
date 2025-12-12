import { UserType } from 'src/user/entities/user.entity';
import { Room } from './room.dto';

export class CreateRoomDto extends Room {
  admin: UserType;
  attendees?: UserType[];
  attendeesId?: string[];
  attendeesCount?: number;
  isPublic: boolean;
  roomId?: string;
  roomName: string;
  startAt?: Date;
}
