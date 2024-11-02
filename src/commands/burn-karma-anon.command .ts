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
      return this.i18n.t('karma.BurnAnonCommand.InvalidCommandMessage', {
        args: {
          command: KarmaCommands.BurnAnon,
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
      return this.getInvalidTransactionMessage(amount);
    }

    const fromUser = await this.karmaService.getUserKarma(fromUserId);
    const toUser = await this.karmaService.getUserKarma(toUserId);

    if (fromUser.balance * 2 < amount || toUser.balance < amount) {
      return this.i18n.t('karma.BurnAnonCommand.NotEnoughBalanceMessage');
    }

    await this.karmaService.addTransaction(
      fromUser,
      fromUser,
      -amount * 2,
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
        ? 'karma.BurnAnonCommand.SuccessMessageWithDescription'
        : 'karma.BurnAnonCommand.SuccessMessage',
      {
        args: {
          selfAmount: amount * 2,
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
      return this.i18n.t('karma.BurnAnonCommand.InvalidAmountMessage');
    }
    return this.i18n.t('karma.BurnAnonCommand.InvalidFormatMessage');
  }
}
