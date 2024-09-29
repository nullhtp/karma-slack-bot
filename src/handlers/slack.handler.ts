import { App } from '@slack/bolt';
import { KarmaService } from '../services/karma.service';
import { WebClient } from '@slack/web-api';

export abstract class SlackHandler {
  constructor(
    protected app: App,
    protected karmaService: KarmaService,
    protected client: WebClient,
  ) {}

  abstract register(): void;

  protected async getMessageText(item: any): Promise<string> {
    if (item.type !== 'message') return '';

    const result = await this.client.conversations.history({
      channel: item.channel,
      latest: item.ts,
      inclusive: true,
      limit: 1,
    });

    return result.messages && result.messages.length > 0
      ? result.messages[0].text
      : '';
  }

  protected async sendEphemeralMessage(
    channel: string,
    user: string,
    text: string,
  ) {
    await this.client.chat.postEphemeral({ channel, user, text });
  }
}
