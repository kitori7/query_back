/**
 *  防伪码实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("code")
export class Code {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", nullable: true })
  batches_id!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  used_time!: string | null;

  @Column({ type: "int", unsigned: true, nullable: true })
  used_sum!: number | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  code_uuid!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  url!: string | null;
}
