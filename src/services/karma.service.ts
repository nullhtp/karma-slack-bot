import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Karma } from '../entities/karma.entity';
import { KarmaTransaction } from '../entities/karma-transaction.entity';
import * as crypto from 'crypto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class KarmaService {
  constructor(
    @InjectRepository(Karma)
    private karmaRepository: Repository<Karma>,
    @InjectRepository(KarmaTransaction)
    private transactionRepository: Repository<KarmaTransaction>,
    private readonly i18n: I18nService,
  ) {}

  // Method to get the last hash from the transaction history
  async getLastTransactionHash(userId: string): Promise<string> {
    const lastTransaction = await this.transactionRepository.findOne({
      where: { user: { userId } },
      order: { date: 'DESC' },
    });
    return lastTransaction ? lastTransaction.currentHash : '';
  }

  // Method to generate a transaction hash
  generateHash(
    transaction: Partial<KarmaTransaction>,
    previousHash: string,
  ): string {
    const data = `${transaction.user.userId}${transaction.initiator.userId}${transaction.amount}${transaction.date}${transaction.description}${previousHash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Method to add a transaction with hashing
  async addTransaction(
    initiator: Karma,
    user: Karma,
    amount: number,
    description: string,
  ): Promise<void> {
    const previousHash = await this.getLastTransactionHash(user.userId);
    const transaction = this.transactionRepository.create({
      user,
      initiator,
      amount,
      description,
      previousHash,
      date: new Date(),
    });

    transaction.currentHash = this.generateHash(transaction, previousHash);
    await this.transactionRepository.save(transaction);

    user.balance += amount;
    await this.karmaRepository.save([user]);
  }

  async getUserKarma(userId: string): Promise<Karma> {
    const karma = await this.karmaRepository.findOne({ where: { userId } });
    return karma;
  }

  async addMonthlyKarmaToUser(userId: string): Promise<void> {
    let userKarma = await this.getUserKarma(userId);

    // If the user does not exist in the database, create them
    if (!userKarma) {
      userKarma = this.karmaRepository.create({ userId, balance: 0 });
      await this.karmaRepository.save(userKarma);
    }

    // Recording a transaction in the log
    await this.addTransaction(
      userKarma,
      userKarma,
      1000,
      this.i18n.t('karma.EarnMonthlyKarma'),
    );
  }

  async getUserTransactions(
    userId: string,
    orderDate: 'ASC' | 'DESC' = 'DESC',
  ): Promise<KarmaTransaction[]> {
    return this.transactionRepository.find({
      where: { user: { userId } },
      order: { date: orderDate },
      relations: ['user', 'initiator'],
    });
  }

  async getLeaderboard(): Promise<Karma[]> {
    return this.karmaRepository.find({
      order: { balance: 'DESC' },
      take: 10,
    });
  }

  async getUserRank(userId: string): Promise<number | null> {
    const allUsers = await this.karmaRepository.find({
      order: { balance: 'DESC' },
    });

    const userIndex = allUsers.findIndex((user) => user.userId === userId);
    return userIndex !== -1 ? userIndex + 1 : null;
  }

  // Method to check the integrity of user transactions and balance
  async verifyTransactionIntegrity(userId: string): Promise<boolean> {
    const transactions = await this.getUserTransactions(userId, 'ASC');
    let previousHash = '';
    let calculatedBalance = 0;

    for (const transaction of transactions) {
      const recalculatedHash = this.generateHash(transaction, previousHash);

      if (recalculatedHash !== transaction.currentHash) {
        return false; // Hash integrity violation
      }

      calculatedBalance += transaction.amount;
      previousHash = transaction.currentHash;
    }

    // Check if the current balance matches the calculated one
    const currentKarma = await this.getUserKarma(userId);
    if (currentKarma.balance !== calculatedBalance) {
      return false; // Balance mismatch
    }

    return true; // Integrity confirmed
  }
}
