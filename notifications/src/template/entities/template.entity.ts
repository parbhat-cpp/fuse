import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import type { UUID } from 'node:crypto';
import { NOTIFICATION_TYPE } from '../types';
import { TemplateTag } from './template-tag.entity';

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
    enum: NOTIFICATION_TYPE,
  })
  type: NOTIFICATION_TYPE;

  @ManyToOne(() => TemplateTag, { eager: true })
  @JoinColumn({ name: 'tag_id' })
  tag: TemplateTag;

  @Column()
  content: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()', onUpdate: 'now()' })
  updated_at: Date;
}
