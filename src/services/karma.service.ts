import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Karma } from '../entities/karma.entity';
import { KarmaTransaction } from '../entities/karma-transaction.entity';
import * as crypto from 'crypto';

@Injectable()
export class KarmaService {
  constructor(
    @InjectRepository(Karma)
    private karmaRepository: Repository<Karma>,
    @InjectRepository(KarmaTransaction)
    private transactionRepository: Repository<KarmaTransaction>,
  ) {}

  // Метод для получения последнего хеша из истории транзакций
  async getLastTransactionHash(userId: string): Promise<string> {
    const lastTransaction = await this.transactionRepository.findOne({
      where: { user: { userId } },
      order: { date: 'DESC' },
    });
    return lastTransaction ? lastTransaction.currentHash : '';
  }

  // Метод для генерации хеша транзакции
  generateHash(
    transaction: Partial<KarmaTransaction>,
    previousHash: string,
  ): string {
    const data = `${transaction.user.userId}${transaction.amount}${transaction.type}${transaction.date}${transaction.description}${previousHash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Метод для добавления транзакции с хешированием
  async addTransaction(
    user: Karma,
    amount: number,
    type: 'earn' | 'spend',
    description: string,
  ): Promise<void> {
    const previousHash = await this.getLastTransactionHash(user.userId);
    const transaction = this.transactionRepository.create({
      user,
      amount,
      type,
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

  async transferKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string,
  ): Promise<boolean> {
    const fromUser = await this.getUserKarma(fromUserId);
    const toUser = await this.getUserKarma(toUserId);

    if (fromUser.balance < amount) {
      return false;
    }

    // Запись транзакций
    await this.addTransaction(
      fromUser,
      -amount,
      'spend',
      `Передано пользователю <@${toUserId}>${description ? `: ${description}` : ''}`,
    );
    await this.addTransaction(
      toUser,
      amount,
      'earn',
      `Получено от пользователя <@${fromUserId}>${description ? `: ${description}` : ''}`,
    );

    return true;
  }

  async burnKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string,
  ): Promise<boolean> {
    const fromUser = await this.getUserKarma(fromUserId);
    const toUser = await this.getUserKarma(toUserId);

    if (fromUser.balance < amount || toUser.balance < amount) {
      return false;
    }

    // Запись транзакций
    await this.addTransaction(
      fromUser,
      -amount,
      'spend',
      `Сожжено вместе с пользователем <@${toUserId}>${description ? `: ${description}` : ''}`,
    );
    await this.addTransaction(
      toUser,
      -amount,
      'spend',
      `Сожжено вместе с пользователем <@${fromUserId}>${description ? `: ${description}` : ''}`,
    );

    return true;
  }

  async addMonthlyKarma(): Promise<void> {
    const users = await this.karmaRepository.find();
    for (const user of users) {
      await this.addMonthlyKarmaToUser(user.userId);
    }
  }

  async addMonthlyKarmaToUser(userId: string): Promise<void> {
    let userKarma = await this.getUserKarma(userId);

    // Если пользователь еще не существует в базе, создаем его
    if (!userKarma) {
      userKarma = this.karmaRepository.create({ userId, balance: 0 });
      await this.karmaRepository.save(userKarma);
    }

    // Запись транзакции в журнал
    await this.addTransaction(
      userKarma,
      1000,
      'earn',
      'Ежемесячное начисление кармы',
    );
  }

  async getUserTransactions(
    userId: string,
    orderDate: 'ASC' | 'DESC' = 'DESC',
  ): Promise<KarmaTransaction[]> {
    return this.transactionRepository.find({
      where: { user: { userId } },
      order: { date: orderDate },
      relations: ['user'],
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

  // Метод для проверки целостности транзакций пользователя
  async verifyTransactionIntegrity(userId: string): Promise<boolean> {
    const transactions = await this.getUserTransactions(userId, 'ASC');
    let previousHash = '';

    for (const transaction of transactions) {
      const recalculatedHash = this.generateHash(transaction, previousHash);

      if (recalculatedHash !== transaction.currentHash) {
        return false; // Нарушение целостности
      }

      previousHash = transaction.currentHash;
    }

    return true; // Целостность подтверждена
  }
}
