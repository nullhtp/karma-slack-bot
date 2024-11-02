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

    const description: string = this.i18n.t(
      'karma.GivenHandler.DescriptionMessage',
      {
        args: {
          messageText,
        },
      },
    );

    const fromUser = await this.karmaService.getUserKarma(user);
    const toUser = await this.karmaService.getUserKarma(item_user);

    if (fromUser.balance < amount) {
      await this.notifyInsufficientKarma(item.channel, user, amount);

      return;
    }

    // Recording transactions
    await this.karmaService.addTransaction(
      fromUser,
      fromUser,
      -amount,
      description ?? '',
    );
    await this.karmaService.addTransaction(
      fromUser,
      toUser,
      amount,
      description ?? '',
    );

    await this.notifyGiver(item.channel, user, item_user, amount);
    await this.notifyReceiver(item.channel, user, item_user, amount);
  }

  private isValidReaction(user: string, itemUser: string): boolean {
    return user !== itemUser && !!itemUser && !!user;
  }

  private async notifyGiver(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    const message: string = this.i18n.t(
      'karma.GivenHandler.SuccessfulMessage',
      {
        args: {
          amount,
          user: itemUser,
        },
      },
    );
    await this.sendEphemeralMessage(channel, user, message);
  }

  private async notifyReceiver(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    const message: string = await this.i18n.t(
      'karma.GivenHandler.ReceivedMessage',
      {
        args: {
          user,
          amount,
        },
      },
    );
    await this.sendEphemeralMessage(channel, itemUser, message);
  }

  private async notifyInsufficientKarma(
    channel: string,
    user: string,
    amount: number,
  ) {
    const message: string = await this.i18n.t(
      'karma.GivenHandler.InsufficientMessage',
      {
        args: {
          amount,
        },
      },
    );
    await this.sendEphemeralMessage(channel, user, message);
  }
}
