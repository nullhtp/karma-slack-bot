import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class VerifyKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Verify}`;
  }

  async handle(command: any): Promise<string> {
    const { user_id } = command;
    return this.verifyKarma(user_id);
  }

  private async verifyKarma(userId: string): Promise<string> {
    const isValid = await this.karmaService.verifyTransactionIntegrity(userId);
    return isValid
      ? '✅ Ваша история кармы в порядке. Все транзакции корректны и не были изменены.'
      : '⚠️ Обнаружено нарушение целостности вашей истории кармы. Пожалуйста, обратитесь к администратору для дальнейшего разбирательства.';
  }
}
