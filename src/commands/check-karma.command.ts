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
    if (isSelf) {
      return this.i18n.t('karma.CheckCommand.SelfMessage', {
        args: {
          balance: karma.balance,
        },
      });
    } else {
      return this.i18n.t('karma.CheckCommand.UserMessage', {
        args: {
          userId,
          balance: karma.balance,
        },
      });
    }
  }
}
