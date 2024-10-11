import { SlackHandler } from './slack.handler';
import { ReactionAddedEvent } from '@slack/bolt';

export const REACTION_GIVE_MAP = {
  four_leaf_clover: 10,
  gem: 100,
  star2: 300,
};

export class ReactionGivenHandler extends SlackHandler {
  register(): void {
    this.app.event('reaction_added', async ({ event }) => {
      await this.handleReaction(event);
    });
  }

  private async handleReaction(event: ReactionAddedEvent) {
    const { reaction, user, item_user, item } = event;

    if (!this.isValidReaction(user, item_user)) return;

    const amount = REACTION_GIVE_MAP[reaction];
    if (!amount || amount <= 0) return;

    const messageText = await this.getMessageText(item);
    const description = `За сообщение: "${messageText}"`;

    const success = await this.karmaService.transferKarma(
      user,
      item_user,
      amount,
      description,
    );

    await this.sendNotifications(
      item.channel,
      user,
      item_user,
      amount,
      success,
    );
  }

  private isValidReaction(user: string, itemUser: string): boolean {
    return user !== itemUser && !!itemUser && !!user;
  }

  private async sendNotifications(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
    success: boolean,
  ) {
    if (success) {
      await this.notifyGiver(channel, user, itemUser, amount);
      await this.notifyReceiver(channel, user, itemUser, amount);
    } else {
      await this.notifyInsufficientKarma(channel, user, amount);
    }
  }

  private async notifyGiver(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    await this.sendEphemeralMessage(
      channel,
      user,
      `You have given ${amount} karma to user <@${itemUser}>.`,
    );
  }

  private async notifyReceiver(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    await this.sendEphemeralMessage(
      channel,
      itemUser,
      `User <@${user}> has given you ${amount} karma!`,
    );
  }

  private async notifyInsufficientKarma(
    channel: string,
    user: string,
    amount: number,
  ) {
    await this.sendEphemeralMessage(
      channel,
      user,
      `You do not have enough karma to give ${amount} points.`,
    );
  }
}
