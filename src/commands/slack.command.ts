import { KarmaService } from '../services/karma.service';

export abstract class SlackCommandHandler {
  constructor(protected karmaService?: KarmaService) {}

  abstract getCommandName(): string;
  abstract handle(command: any): Promise<string>;

  protected extractUserId(mention: string): string {
    return mention.startsWith('<@') ? mention.split('|')[0].slice(2) : mention;
  }
}
