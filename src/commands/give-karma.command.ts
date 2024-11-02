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
      return this.i18n.t('karma.GiveCommand.InvalidCommandMessage', {
        args: {
          command: KarmaCommands.Give,
        },
      });
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

    const fromUser = await this.karmaService.getUserKarma(fromUserId);
    const toUser = await this.karmaService.getUserKarma(toUserId);

    if (fromUser.balance < amount) {
      return this.i18n.t('karma.GiveCommand.NotEnoughBalanceMessage');
    }

    // Recording transactions
    await this.karmaService.addTransaction(
      fromUser,
      fromUser,
      -amount,
      description ?? '',
    );
    await this.karmaService.addTransaction(
      fromUser,
      toUser,
      amount,
      description ?? '',
    );

    return this.i18n.t(
      description
        ? 'karma.GiveCommand.SuccessMessageWithDescription'
        : 'karma.GiveCommand.SuccessMessage',
      {
        args: {
          amount,
          description,
          user: toUserId,
        },
      },
    );
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
      return this.i18n.t('karma.GiveCommand.InvalidAmountMessage');
    }
    return this.i18n.t('karma.GiveCommand.InvalidFormatMessage');
  }
}
