import { UUID } from 'node:crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'profiles' })
export class User {
  @PrimaryColumn({
    type: 'uuid',
    primary: true,
  })
  id: UUID;

  @Column({
    type: 'text',
  })
  full_name: string;

  @Column({
    unique: true,
    type: 'text',
    nullable: true,
  })
  username: string;

  @Column({
    type: 'text',
  })
  avatar_url: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  premium_account?: string;
}

export interface UserType {
  id: UUID;
  full_name: string;
  username: string;
  avatar_url: string;
  premium_account: string;
}
export interface SocketUserType {
  id: UUID;
  socketId: string;
  full_name: string;
  username: string;
  avatar_url: string;
  premium_account: string;
}
