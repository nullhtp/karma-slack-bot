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
      .map((k, i) =>
        this.i18n.t('karma.TopCommand.ItemMessage', {
          args: { index: i + 1, userId: k.userId, balance: k.balance },
        }),
      )
      .join('\n');

    let response: string = this.i18n.t('karma.TopCommand.ListMessage', {
      args: { topList },
    });

    if (userRank) {
      response += this.i18n.t('karma.TopCommand.SelfRankMessage', {
        args: { userRank },
      });
    }

    return response;
  }
}
