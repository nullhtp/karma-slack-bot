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
    return this.i18n.t('karma.HelpCommand.Message');
  }
}
