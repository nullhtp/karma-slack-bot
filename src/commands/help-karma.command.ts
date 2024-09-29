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
    return `
        *Команды карма-бота*:
        1. \`/karma [@user]\` - Проверить ваш текущий баланс кармы.
        2. \`/karma_${KarmaCommands.Give} @user amount [описание]\` - Передать карму другому пользователю с возможностью указать за что.
        3. \`/karma_${KarmaCommands.Burn} @user amount [описание]\` - Сжечь карму у себя и у другого пользователя с возможностью указать причину.
        4. \`/karma_${KarmaCommands.History} [@user]\` - Просмотреть историю транзакций кармы (последние 10 записей). Если указан @user, показывает историю этого пользователя.
        5. \`/karma_${KarmaCommands.Top}\` - Посмотреть таблицу лидеров по количеству кармы.
        6. \`/karma_${KarmaCommands.Help}\` - Показать все доступные команды и их описание.
        7. \`/karma_${KarmaCommands.Verify} [@user]\` - Проверка целостности истории кармы.

        *Реакции и начисления кармы*:
        - 🍀 (\`:four_leaf_clover:\`) - передает 10 очков кармы.
        - 💎 (\`:gem:\`) - передает 100 очков кармы.
        - 🌟 (\`:star2:\`) - передает 300 очков кармы.

        - 🧨 (\`:firecracker:\`) - сжигает 10 очков кармы у вас обоих.
        - 💣 (\`:bomb:\`) - сжигает 100 очков кармы у вас обоих.
        - 💥 (\`:collision:\`) - сжигает 300 очков кармы у вас обоих.

        Например, чтобы передать карму, используйте: \`/karma_give @username 50 За помощь в проекте\`.
        `;
  }
}
