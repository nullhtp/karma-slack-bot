import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class TopKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Top}`;
  }

  async handle(): Promise<string> {
    return this.getTop();
  }

  private async getTop(): Promise<string> {
    const leaderboard = await this.karmaService.getLeaderboard();
    const text = leaderboard
      .map((k, i) => `${i + 1}. <@${k.userId}> – ${k.balance} очков`)
      .join('\n');

    return `*Топ пользователей по карме:*\n${text}`;
  }
}
