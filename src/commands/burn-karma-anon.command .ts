import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class BurnKarmaAnonCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.BurnAnon}`;
  }

  async handle(command: any): Promise<string> {
    const { user_id, text } = command;
    const [userMention, amountStr, ...descriptionParts] = text
      .trim()
      .split(' ');
    const description = descriptionParts.join(' ');

    if (!this.isValidCommandFormat(userMention, amountStr, description)) {
      return `Using: '/karma_${KarmaCommands.BurnAnon} @user amount description'`;
    }

    const toUserId = this.extractUserId(userMention);
    const amount = parseInt(amountStr, 10);

    return this.burnKarma(user_id, toUserId, amount, description);
  }

  private isValidCommandFormat(
    userMention: string,
    amountStr: string,
    description: string,
  ): boolean {
    return (
      userMention.startsWith('<@') &&
      userMention.endsWith('>') &&
      !isNaN(parseInt(amountStr, 10)) &&
      description.length > 3
    );
  }

  private async burnKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<string> {
    if (!this.isValidKarmaTransaction(fromUserId, toUserId, amount)) {
      return this.getInvalidTransactionMessage(amount, true);
    }

    const success = await this.karmaService.burnKarma(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    return success
      ? `You have burned ${amount * 2} karma from yourself and ${amount} from user <@${toUserId}>${description ? ` with the message: "${description}"` : ''}.`
      : 'You or the specified user do not have enough karma to burn the specified amount.';
  }

  private isValidKarmaTransaction(
    fromUserId: string,
    toUserId: string,
    amount: number,
  ): boolean {
    return toUserId && toUserId !== fromUserId && !isNaN(amount) && amount > 0;
  }

  private getInvalidTransactionMessage(
    amount: number,
    isBurn: boolean = false,
  ): string {
    if (isNaN(amount) || amount <= 0) {
      return `Please specify a valid amount of karma for ${isBurn ? 'burning' : 'transfer'}.`;
    }
    return 'Invalid command format. Please check the specified user and amount.';
  }
}
