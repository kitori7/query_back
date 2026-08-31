/**
 * 公司实体
 */
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("company")
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name!: string | null;
}
