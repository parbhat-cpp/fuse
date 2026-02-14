import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { UUID } from 'node:crypto';

@Entity({ name: 'templates' })
export class Template {
  @PrimaryColumn({
    type: 'uuid',
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  id: UUID;

  @Column({
    type: 'enum',
    enum: ['email', 'push'],
  })
  type: 'email' | 'push';

  @Column()
  content: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()', onUpdate: 'now()' })
  updated_at: Date;
}
