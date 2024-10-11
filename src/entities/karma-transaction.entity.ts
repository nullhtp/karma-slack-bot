import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Karma } from './karma.entity';

@Entity()
export class KarmaTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Karma, (user) => user.transactions)
  user: Karma;

  @ManyToOne(() => Karma)
  initiator: Karma;

  @Column()
  amount: number;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  date: Date;

  @Column({ nullable: true })
  previousHash: string;

  @Column()
  currentHash: string;
}
