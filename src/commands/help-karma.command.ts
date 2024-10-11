import { SlackCommandHandler } from './slack.command';
import { KarmaCommands } from '../constants';

export class HelpKarmaCommand extends SlackCommandHandler {
  getCommandName(): string {
    return `/karma_${KarmaCommands.Help}`;
  }

  async handle(): Promise<string> {
    return this.getHelp();
  }

  private getHelp(): string {
    return `
        *Karma Bot Commands*:
        1. \`/karma [@user]\` - Check your current karma balance.
        2. \`/karma_${KarmaCommands.Give} @user amount [description]\` - Transfer karma to another user with the option to specify the reason.
        3. \`/karma_${KarmaCommands.Burn} @user amount [description]\` - Burn karma from yourself and another user with the option to specify the reason.
        3. \`/karma_${KarmaCommands.BurnAnon} @user amount description\` - Burn karma from yourself (x2) and another user anonymously with specify the reason.
        4. \`/karma_${KarmaCommands.History} [@user]\` - View the karma transaction history (last 10 entries). If @user is specified, shows that user's history.
        5. \`/karma_${KarmaCommands.Top}\` - View the leaderboard for the amount of karma.
        6. \`/karma_${KarmaCommands.Help}\` - Show all available commands and their descriptions.
        7. \`/karma_${KarmaCommands.Verify} [@user]\` - Verify the integrity of the karma history.

        *Reactions and Karma Accumulation*:
        - 🍀 (\`:four_leaf_clover:\`) - transfers 10 karma points.
        - 💎 (\`:gem:\`) - transfers 100 karma points.
        - 🌟 (\`:star2:\`) - transfers 300 karma points.

        - 🧨 (\`:firecracker:\`) - burns 10 karma points from both of you.
        - 💣 (\`:bomb:\`) - burns 100 karma points from both of you.
        - 💥 (\`:collision:\`) - burns 300 karma points from both of you.

        For example, to transfer karma, use: \`/karma_give @username 50 For help with the project\`.
        `;
  }
}
