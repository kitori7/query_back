/**
 *  批次实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("batches")
export class Batches {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  create_time!: string;

  @Column()
  product_id!: number;

  @Column({ type: "json" })
  img_url!: JSON;
}
