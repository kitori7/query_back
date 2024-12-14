/**
 *  防伪码实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("code")
export class Code {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  batches_id!: number;

  @Column()
  used_time!: string;

  @Column({ default: 0 })
  used_sum!: number;

  @Column()
  code_uuid!: string;

  @Column()
  url!: string;
}
