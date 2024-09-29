import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { KarmaTransaction } from './karma-transaction.entity';

@Entity()
export class Karma {
  @PrimaryColumn()
  userId: string;

  @Column({ default: 0 })
  balance: number;

  @OneToMany(() => KarmaTransaction, (transaction) => transaction.user)
  transactions: KarmaTransaction[];
}
