import { I18nService } from 'nestjs-i18n';
import { KarmaService } from '../services/karma.service';

export abstract class SlackCommandHandler {
  constructor(
    protected i18n: I18nService,
    protected karmaService?: KarmaService,
  ) {}

  abstract getCommandName(): string;
  abstract handle(command: any): Promise<string>;

  protected extractUserId(mention: string): string {
    return mention.startsWith('<@') ? mention.split('|')[0].slice(2) : mention;
  }
}
