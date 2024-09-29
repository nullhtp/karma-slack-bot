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
    const description = `За сообщение: "${messageText}"`;

    const success = await this.karmaService.burnKarma(
      user,
      item_user,
      Math.abs(amount),
      description,
    );

    await this.sendNotifications(
      item.channel,
      user,
      item_user,
      Math.abs(amount),
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
      await this.notifyBurner(channel, user, itemUser, amount);
      await this.notifyVictim(channel, user, itemUser, amount);
    } else {
      await this.notifyInsufficientKarma(channel, user, itemUser, amount);
    }
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
      `Вы сожгли ${amount} кармы у пользователя <@${itemUser}> и у себя.`,
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
      `Пользователь <@${user}> сжег ${amount} вашей кармы!`,
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
      `У пользователя <@${itemUser}> недостаточно кармы для сжигания ${amount} очков.`,
    );
  }
}
