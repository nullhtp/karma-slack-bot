import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class VerifyKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Verify}`;
  }

  async handle(command: any): Promise<string> {
    const userId = this.extractUserId(command.text.trim()) || command.user_id;
    const isSelf = userId === command.user_id;

    return this.verifyKarma(userId, isSelf);
  }

  private async verifyKarma(userId: string, isSelf: boolean): Promise<string> {
    const isValid = await this.karmaService.verifyTransactionIntegrity(userId);
    const userMention = isSelf ? 'Your' : `User <@${userId}>`;
    return isValid
      ? `✅ ${userMention} karma history is in order. All transactions are correct and have not been altered.`
      : `⚠️ Integrity violation detected in ${userMention.toLowerCase()} karma history. Please contact the administrator for further investigation.`;
  }
}
