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
    const description = `For the message: "${messageText}"`;

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
    await this.sendEphemeralMessage(
      channel,
      user,
      `You burned ${amount} karma from user <@${itemUser}> and from yourself.`,
    );
  }

  private async notifyVictim(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    await this.sendEphemeralMessage(
      channel,
      itemUser,
      `User <@${user}> burned ${amount} of your karma!`,
    );
  }

  private async notifyInsufficientKarma(
    channel: string,
    user: string,
    itemUser: string,
    amount: number,
  ) {
    await this.sendEphemeralMessage(
      channel,
      user,
      `User <@${itemUser}> does not have enough karma to burn ${amount} points.`,
    );
  }
}
