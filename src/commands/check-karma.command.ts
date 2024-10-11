import { SlackCommandHandler } from './slack.command';

export class CheckKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return '/karma';
  }

  async handle(command: any): Promise<string> {
    const { user_id, text } = command;
    const mentionedUserId = this.extractUserId(text.trim());
    const userId = mentionedUserId || user_id;
    const isSelf = userId === user_id;

    return this.checkKarma(userId, isSelf);
  }

  private async checkKarma(userId: string, isSelf: boolean): Promise<string> {
    const karma = await this.karmaService.getUserKarma(userId);
    return isSelf
      ? `Your current karma balance: ${karma.balance} points.`
      : `Current karma balance of user <@${userId}>: ${karma.balance} points.`;
  }
}
