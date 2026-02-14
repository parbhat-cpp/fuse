import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne } from 'typeorm';
import type { UUID } from 'node:crypto';
import { Template } from 'src/template/entities/template.entity';

@Entity({ name: 'notifications' })
export class Notification {
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

  @ManyToOne(() => Template, (template) => template.id, { eager: true })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ default: false })
  read: boolean;

  @Column()
  recipient_id: string;

  @Column()
  title: string;

  @Column('json')
  data: Record<string, any>;

  @Column()
  message: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()', onUpdate: 'now()' })
  updated_at: Date;
}
