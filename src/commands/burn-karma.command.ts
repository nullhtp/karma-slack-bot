import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class BurnKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Burn}`;
  }

  async handle(command: any): Promise<string> {
    const { user_id, text } = command;
    const [userMention, amountStr, ...descriptionParts] = text
      .trim()
      .split(' ');
    const description = descriptionParts.join(' ');

    if (!this.isValidCommandFormat(userMention, amountStr)) {
      return this.i18n.t('karma.BurnCommand.InvalidCommandMessage', {
        args: {
          command: KarmaCommands.Burn,
        },
      });
    }

    const toUserId = this.extractUserId(userMention);
    const amount = parseInt(amountStr, 10);

    return this.burnKarma(user_id, toUserId, amount, description);
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

  private async burnKarma(
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

    if (fromUser.balance < amount || toUser.balance < amount) {
      return this.i18n.t('karma.BurnCommand.NotEnoughBalanceMessage');
    }

    // Recording transactions
    await this.karmaService.addTransaction(
      fromUser,
      fromUser,
      -amount,
      description,
    );
    await this.karmaService.addTransaction(
      fromUser,
      toUser,
      -amount,
      description,
    );

    return this.i18n.t(
      description
        ? 'karma.BurnCommand.SuccessMessageWithDescription'
        : 'karma.BurnCommand.SuccessMessage',
      {
        args: {
          amount,
          user: toUserId,
          description,
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
      return this.i18n.t('karma.BurnCommand.InvalidAmountMessage');
    }
    return this.i18n.t('karma.BurnCommand.InvalidFormatMessage');
  }
}
