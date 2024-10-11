import { SlackHandler } from './slack.handler';

export class TeamJoinHandler extends SlackHandler {
  register(): void {
    this.app.event('team_join', async ({ event }) => {
      await this.handleTeamJoin(event.user.id);
    });
  }

  private async handleTeamJoin(userId: string) {
    await this.karmaService.addMonthlyKarmaToUser(userId);
    console.log(
      `Monthly karma has been credited to the new user <@${userId}>.`,
    );
  }
}
