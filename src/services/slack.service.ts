import { Injectable, OnModuleInit } from '@nestjs/common';
import { App, ReactionAddedEvent } from '@slack/bolt';
import { KarmaService } from './karma.service';
import { WebClient } from '@slack/web-api';

const reactionMap = {
  four_leaf_clover: 10,
  gem: 100,
  star2: 300,
  firecracker: -10,
  bomb: -100,
  collision: -300,
};

enum KarmaCommands {
  Top = 'top',
  Give = 'give',
  Burn = 'burn',
  Verify = 'verify',
  History = 'history',
  Help = 'help',
}

@Injectable()
export class SlackService implements OnModuleInit {
  private app: App;
  private client: WebClient;

  constructor(private karmaService: KarmaService) {}

  onModuleInit() {
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      socketMode: true,
    });

    this.client = this.app.client;

    this.registerEventHandlers();
    this.app.start().then(() => {
      console.log('⚡️ Slack bot is running!');
      this.createUsersAndAddKarma();
    });
  }

  //
  private async createUsersAndAddKarma() {
    try {
      // Получаем список всех пользователей из Slack
      const result = await this.client.users.list();

      if (!result.members) {
        return;
      }

      for (const member of result.members) {
        if (
          member.is_bot ||
          member.deleted ||
          member.is_app_user ||
          member.is_connector_bot ||
          member.is_workflow_bot ||
          member.id === 'USLACKBOT'
        ) {
          continue;
        }

        const userId = member.id;
        const userExists = await this.karmaService.getUserKarma(userId);

        // Если пользователя нет в базе, добавляем месячную карму
        if (!userExists) {
          await this.karmaService.addMonthlyKarmaToUser(userId);
          console.log(`Начислена месячная карма пользователю <@${userId}>.`);
        }
      }
    } catch (error) {
      console.error('Ошибка при начислении кармы всем пользователям:', error);
    }
  }

  private registerEventHandlers() {
    // Обработчик события добавления реакции
    this.app.event('reaction_added', async ({ event }) => {
      await this.handleReaction(event);
    });

    // Обработчик события присоединения нового пользователя
    this.app.event('team_join', async ({ event }) => {
      const userId = event.user.id;
      await this.karmaService.addMonthlyKarmaToUser(userId);
      console.log(`Начислена месячная карма новому пользователю <@${userId}>.`);
    });

    // Команда для передачи кармы с описанием
    this.app.command(
      `/karma_${KarmaCommands.Give}`,
      async ({ command, ack, respond }) => {
        await ack();
        const args = command.text.trim();
        const parts = args.split(' ');

        if (parts.length < 2) {
          await respond(
            `Использование: '/karma_${KarmaCommands.Give} @user amount [описание]'`,
          );
          return;
        }

        const userMention = parts[0];
        const amountStr = parts[1];
        const description = parts.slice(2).join(' ');

        if (!userMention.startsWith('<@') || !userMention.endsWith('>')) {
          await respond('Укажите пользователя в формате `@username`.');
          return;
        }

        const toUserId = userMention.split('|')[0].slice(2);
        const amount = parseInt(amountStr, 10);

        const result = await this.giveKarma(
          command.user_id,
          toUserId,
          amount,
          description,
        );

        if (result) {
          await respond(result);
        }
      },
    );

    this.app.command('/karma', async ({ command, ack, respond }) => {
      await ack();
      const args = command.text.trim();

      let userId = command.user_id;

      if (args.startsWith('<@') && args.endsWith('>')) {
        userId = args.split('|')[0].slice(2);
      }

      const result = await this.checkKarma(userId, userId === command.user_id);
      await respond(result);
    });

    // Команда для просмотра истории кармы
    this.app.command(
      `/karma_${KarmaCommands.History}`,
      async ({ command, ack, respond }) => {
        await ack();
        const result = await this.getHistory(command.user_id);
        await respond(result);
      },
    );

    // Команда для проверки целостности кармы
    this.app.command(
      `/karma_${KarmaCommands.Verify}`,
      async ({ command, ack, respond }) => {
        await ack();
        const result = await this.verifyKarma(command.user_id);
        await respond(result);
      },
    );

    this.app.command(
      `/karma_${KarmaCommands.Help}`,
      async ({ ack, respond }) => {
        await ack();
        const result = this.getHelp();
        await respond(result);
      },
    );

    // Команда для отображения таблицы лидеров
    this.app.command(
      `/karma_${KarmaCommands.Top}`,
      async ({ ack, respond }) => {
        await ack();
        const result = await this.getTop();
        await respond(result);
      },
    );

    this.app.command(
      `/karma_${KarmaCommands.Burn}`,
      async ({ command, ack, respond }) => {
        await ack();
        const args = command.text.trim();
        const parts = args.split(' ');

        if (parts.length < 2) {
          await respond(
            `Использование: '/karma_${KarmaCommands.Burn} @user amount [описание]'`,
          );
          return;
        }

        const userMention = parts[0];
        const amountStr = parts[1];
        const description = parts.slice(2).join(' ');

        if (!userMention.startsWith('<@') || !userMention.endsWith('>')) {
          await respond('Укажите пользователя в формате `@username`.');
          return;
        }

        const toUserId = userMention.split('|')[0].slice(2);
        const amount = parseInt(amountStr, 10);

        const result = await this.burnKarma(
          command.user_id,
          toUserId,
          amount,
          description,
        );

        await respond(result);
      },
    );
  }

  private async handleReaction(event: ReactionAddedEvent) {
    const { reaction, user, item_user, item } = event;

    if (user === item_user || !item_user || !user) return;

    const amount = reactionMap[reaction];
    if (!amount) return;

    // Получаем текст сообщения, на которое была поставлена реакция
    let messageText = '';
    if (item.type === 'message') {
      const result = await this.client.conversations.history({
        channel: item.channel,
        latest: item.ts,
        inclusive: true,
        limit: 1,
      });
      if (result.messages && result.messages.length > 0) {
        messageText = result.messages[0].text;
      }
    }

    const description = `За сообщение: "${messageText}"`;

    let success: boolean;
    let actionText: string;

    if (amount > 0) {
      success = await this.karmaService.transferKarma(
        user,
        item_user,
        amount,
        description,
      );
      actionText = 'передали';
    } else {
      success = await this.karmaService.burnKarma(
        user,
        item_user,
        Math.abs(amount),
        description,
      );
      actionText = 'сожгли';
    }

    if (success) {
      await this.client.chat.postEphemeral({
        channel: item.channel,
        user,
        text: `Вы ${actionText} ${Math.abs(amount)} кармы ${amount > 0 ? 'пользователю' : 'у пользователя'} <@${item_user}>.`,
      });

      await this.client.chat.postEphemeral({
        channel: item.channel,
        user: item_user,
        text: `Пользователь <@${user}> ${actionText} ${Math.abs(amount)} ${amount > 0 ? 'кармы вам' : 'вашей кармы'}!`,
      });
    } else {
      await this.client.chat.postEphemeral({
        channel: item.channel,
        user,
        text: `У вас ${amount > 0 ? 'недостаточно кармы для передачи' : 'или у указанного пользователя недостаточно кармы для сжигания'} ${Math.abs(amount)} очков.`,
      });
    }
  }

  private async giveKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ) {
    if (isNaN(amount) || amount <= 0) {
      return 'Укажите корректную сумму кармы для передачи.';
    }

    if (!toUserId) {
      return 'Пользователь не найден';
    }

    if (toUserId === fromUserId) {
      return 'Нельзя передавать карму самому себе.';
    }

    const success = await this.karmaService.transferKarma(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    if (success) {
      return `Вы передали ${amount} кармы пользователю <@${toUserId}>${description ? ` с сообщением: "${description}"` : ''}.`;
    } else {
      return 'У вас недостаточно кармы для передачи указанной суммы.';
    }
  }

  private async getHistory(userId: string) {
    const transactions = await this.karmaService.getUserTransactions(userId);

    if (transactions.length === 0) {
      return 'У вас нет записей в истории кармы.';
    }

    const history = transactions
      .slice(0, 10)
      .map(
        (t) =>
          `${t.date.toLocaleString()} | ${t.amount > 0 ? '+' : ''}${t.amount} | ${t.description}`,
      )
      .join('\n');

    return `*Ваши последние транзакции кармы:*\n${history}`;
  }

  private async checkKarma(userId: string, isSelf: boolean) {
    const karma = await this.karmaService.getUserKarma(userId);
    if (isSelf) {
      return `Ваш текущий баланс кармы: ${karma.balance} очков.`;
    } else {
      return `Текущий баланс кармы пользователя <@${userId}>: ${karma.balance} очков.`;
    }
  }

  private async verifyKarma(userId: string) {
    const isValid = await this.karmaService.verifyTransactionIntegrity(userId);

    if (isValid) {
      return '✅ Ваша история кармы в порядке. Все транзакции корректны и не были изменены.';
    } else {
      return '⚠️ Обнаружено нарушение целостности вашей истории кармы. Пожалуйста, обратитесь к администратору для дальнейшего разбирательства.';
    }
  }

  private getHelp() {
    const helpText = `
        *Команды карма-бота*:
        1. \`/karma\` - Проверить ваш текущий баланс кармы.
        2. \`/karma_${KarmaCommands.Give} @user amount [описание]\` - Передать карму другому пользователю с возможностью указать за что.
        3. \`/karma_${KarmaCommands.Burn} @user amount [описание]\` - Сжечь карму у себя и у другого пользователя с возможностью указать причину.
        4. \`/karma_${KarmaCommands.History}\` - Просмотреть вашу историю транзакций кармы (последние 10 записей).
        5. \`/karma_${KarmaCommands.Top}\` - Посмотреть таблицу лидеров по количеству кармы.
        6. \`/karma_${KarmaCommands.Help}\` - Показать все доступные команды и их описание.
        7. \`/karma_${KarmaCommands.Verify}\` - Проверка целостности истории кармы.

        *Реакции и начисления кармы*:
        - 🍀 (\`:four_leaf_clover:\`) - передает 10 очков кармы.
        - 💎 (\`:gem:\`) - передает 100 очков кармы.
        - 🌟 (\`:star2:\`) - передает 300 очков кармы.

        - 🧨 (\`:firecracker:\`) - сжигает 10 очков кармы у вас обоих.
        - 💣 (\`:bomb:\`) - сжигает 100 очков кармы у вас обоих.
        - 💥 (\`:collision:\`) - сжигает 300 очков кармы у вас обоих.

        Например, чтобы передать карму, используйте: \`/givekarma @username 50 За помощь в проекте\`.
        `;
    return helpText;
  }

  private async getTop() {
    const leaderboard = await this.karmaService.getLeaderboard();
    const text = leaderboard
      .map((k, i) => `${i + 1}. <@${k.userId}> – ${k.balance} очков`)
      .join('\n');

    return `*Топ пользователей по карме:*\n${text}`;
  }

  // Add this new method
  private async burnKarma(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ) {
    if (isNaN(amount) || amount <= 0) {
      return 'Укажите корректную сумму кармы для сжигания.';
    }

    if (!toUserId) {
      return 'Пользователь не найден';
    }

    if (toUserId === fromUserId) {
      return 'Нельзя сжигать карму самому себе.';
    }

    const success = await this.karmaService.burnKarma(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    if (success) {
      return `Вы сожгли ${amount} кармы у себя и у пользователя <@${toUserId}>${description ? ` с сообщением: "${description}"` : ''}.`;
    } else {
      return 'У вас или у указанного пользователя недостаточно кармы для сжигания указанной суммы.';
    }
  }
}
