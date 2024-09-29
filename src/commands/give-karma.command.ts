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
      return `Использование: '/karma_${KarmaCommands.Give} @user amount [описание]'`;
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
      ? `Вы передали ${amount} кармы пользователю <@${toUserId}>${description ? ` с сообщением: "${description}"` : ''}.`
      : 'У вас недостаточно кармы для передачи указанной суммы.';
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
      return `Укажите корректную сумму кармы для передачи.`;
    }
    return 'Некорректный формат команды. Проверьте указанного пользователя и сумму.';
  }
}
