import { UUID } from 'node:crypto';
import { User, UserType } from 'src/user/entities/user.entity';
import { Column, Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity({ name: 'room_scheduler' })
export class RoomScheduler {
  @PrimaryColumn({
    type: 'uuid',
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  id: UUID;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  admin: UserType;

  @Column()
  user_id: UUID;

  @Column()
  isPublic: boolean;

  @Column({
    unique: true,
  })
  roomId: string;

  @Column()
  roomName: string;

  @Column({
    type: 'timestamptz',
  })
  start_at: string;

  @Column()
  status: string;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  updated_at: Date;
}
