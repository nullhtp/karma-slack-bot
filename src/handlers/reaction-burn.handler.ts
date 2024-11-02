import { SlackHandler } from './slack.handler';
import { ReactionAddedEvent } from '@slack/bolt';

export const REACTION_BURN_MAP = {
  firecracker: -10,
  bomb: -100,
  collision: -300,
};

export class ReactionBurnHandler extends SlackHandler {
  register(): void {
    this.app.event('reaction_added', async ({ event }) => {
      await this.handleReaction(event);
    });
  }

  private async handleReaction(event: ReactionAddedEvent) {
    const { reaction, user, item_user, item } = event;

    if (!this.isValidReaction(user, item_user)) return;

    const amount = REACTION_BURN_MAP[reaction];
    if (!amount || amount >= 0) return;

    const messageText = await this.getMessageText(item);
    const description: string = this.i18n.t(
      'karma.BurnHandler.DescriptionMessage',
      {
        args: {
          messageText,
        },
      },
    );

    const fromUser = await this.karmaService.getUserKarma(user);
    const toUser = await this.karmaService.getUserKarma(item_user);

    if (fromUser.balance < amount || toUser.balance < amount) {
      await this.notifyInsufficientKarma(item.channel, user, item_user, amount);

      return;
    }

    // Recording transactions
    await this.karmaService.addTransaction(
      fromUser,
      fromUser,
      -amount,
      description,
    );
    await this.karmaService.addTransaction(
      fromUser,
      toUser,
      -amount,
      description,
    );

    await this.notifyBurner(item.channel, user, item_user, amount);
    await this.notifyVictim(item.channel, user, item_user, amount);
  }

  private isValidReaction(user: string, itemUser: string): boolean {
    return user !== itemUser && !!itemUser && !!user;
  }

  private async notifyBurner(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    const message: string = await this.i18n.translate(
      'karma.BurnHandler.SuccessfulMessage',
      {
        args: {
          amount,
          user: itemUser,
        },
      },
    );

    await this.sendEphemeralMessage(channel, user, message);
  }

  private async notifyVictim(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    const message = await this.i18n.translate(
      'karma.BurnHandler.ReceivedMessage',
      {
        args: {
          amount,
          user,
        },
      },
    );
    await this.sendEphemeralMessage(channel, itemUser, message);
  }

  private async notifyInsufficientKarma(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    const message = await this.i18n.translate(
      'karma.BurnHandler.InsufficientMessage',
      {
        args: {
          amount,
          user: itemUser,
        },
      },
    );
    await this.sendEphemeralMessage(channel, user, message);
  }
}
