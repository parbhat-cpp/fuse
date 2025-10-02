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

  @Column({
    type: 'text',
    nullable: false,
  })
  email: string;

  @Column({
    type: "timestamptz",
    default: new Date(),
  })
  created_at: string;

  @Column({
    type: "timestamptz",
    default: new Date(),
  })
  updated_at: string;
}

export interface UserType {
  id: UUID;
  full_name: string;
  username: string;
  avatar_url: string;
  premium_account: string;
  email: string;
  created_at: string;
  updated_at: string;
}
