import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class GiveKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Give}`;
  }

  private isValidCommandFormat(
    userMention: string,
    amountStr: string,
  ): boolean {
    return (
      userMention.startsWith('<@') &&
      userMention.endsWith('>') &&
      !isNaN(parseInt(amountStr, 10))
    );
  }

  async handle(command: any): Promise<string> {
    const { user_id, text } = command;
    const [userMention, amountStr, ...descriptionParts] = text
      .trim()
      .split(' ');
    const description = descriptionParts.join(' ');

    if (!this.isValidCommandFormat(userMention, amountStr)) {
      return `Usage: '/karma_${KarmaCommands.Give} @user amount [description]'`;
    }

    const toUserId = this.extractUserId(userMention);
    const amount = parseInt(amountStr, 10);

    return this.giveKarma(user_id, toUserId, amount, description);
  }

  private async giveKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<string> {
    if (!this.isValidKarmaTransaction(fromUserId, toUserId, amount)) {
      return this.getInvalidTransactionMessage(amount);
    }

    const success = await this.karmaService.transferKarma(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    return success
      ? `You have transferred ${amount} karma to user <@${toUserId}>${description ? ` with message: "${description}"` : ''}.`
      : 'You do not have enough karma to transfer the specified amount.';
  }

  private isValidKarmaTransaction(
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): boolean {
    return toUserId && toUserId !== fromUserId && !isNaN(amount) && amount > 0;
  }

  private getInvalidTransactionMessage(amount: number): string {
    if (isNaN(amount) || amount <= 0) {
      return `Please specify a valid amount of karma to transfer.`;
    }
    return 'Invalid command format. Check the specified user and amount.';
  }
}
