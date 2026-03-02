import type { UUID } from 'node:crypto';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'template_tags' })
export class TemplateTag {
  @PrimaryColumn({
    type: 'uuid',
    nullable: false,
    default: () => 'uuid_generate_v4()',
  })
  id: UUID;

  @Column({
    type: 'text',
    nullable: false,
    unique: true,
  })
  tag: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()', onUpdate: 'now()' })
  updated_at: Date;
}
