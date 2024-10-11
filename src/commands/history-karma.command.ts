import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class KarmaHistoryCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.History}`;
  }

  async handle(command: any): Promise<string> {
    const userId = this.extractUserId(command.text.trim()) || command.user_id;
    const isSelf = userId === command.user_id;
    return this.getHistory(userId, isSelf);
  }

  private async getHistory(userId: string, isSelf: boolean): Promise<string> {
    const transactions = await this.karmaService.getUserTransactions(userId);

    if (transactions.length === 0) {
      return isSelf
        ? 'You have no records in your karma history.'
        : `User <@${userId}> has no records in their karma history.`;
    }

    const history = this.formatTransactionHistory(transactions);
    const prefix = isSelf
      ? 'Your latest karma transactions:'
      : `Latest karma transactions of user <@${userId}>:`;

    return `*${prefix}*\n${history}`;
  }

  private formatTransactionHistory(transactions: any[]): string {
    return transactions
      .slice(0, 10)
      .map(
        (t) =>
          `${t.date.toLocaleString()} | ${t.amount > 0 ? '+' : ''}${t.amount} | ${t.description}`,
      )
      .join('\n');
  }
}
