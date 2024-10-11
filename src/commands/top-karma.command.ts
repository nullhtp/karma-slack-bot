import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class TopKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Top}`;
  }

  async handle(command: any): Promise<string> {
    return this.getTop(command.user_id);
  }

  private async getTop(currentUserId: string): Promise<string> {
    const leaderboard = await this.karmaService.getLeaderboard();
    const userRank = await this.karmaService.getUserRank(currentUserId);

    const topList = leaderboard
      .map((k, i) => `${i + 1}. <@${k.userId}> – ${k.balance} points`)
      .join('\n');

    let response = `*Top users by karma:*\n${topList}`;

    if (userRank) {
      response += `\n\nYour rank in the leaderboard: ${userRank}`;
    }

    return response;
  }
}
