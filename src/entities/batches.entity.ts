/**
 *  批次实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("batches")
export class Batches {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;

  @Column({ type: "datetime", nullable: true })
  create_time!: Date | null;

  @Column({ type: "int", nullable: true })
  product_id!: number | null;

  @Column({ type: "json", nullable: true })
  img_url!: string[] | null;

  @Column({ type: "tinyint", nullable: true, default: null, select: false })
  uniqueness_enforced!: number | null;
}
