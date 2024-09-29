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
      return `Использование: '/karma_${KarmaCommands.Burn} @user amount [описание]'`;
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
      return this.getInvalidTransactionMessage(amount, true);
    }

    const success = await this.karmaService.burnKarma(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    return success
      ? `Вы сожгли ${amount} кармы у себя и у пользователя <@${toUserId}>${description ? ` с сообщением: "${description}"` : ''}.`
      : 'У вас или у указанного пользователя недостаточно кармы для сжигания указанной суммы.';
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
      return `Укажите корректную сумму кармы для ${isBurn ? 'сжигания' : 'передачи'}.`;
    }
    return 'Некорректный формат команды. Проверьте указанного пользователя и сумму.';
  }
}
