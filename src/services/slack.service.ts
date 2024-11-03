import { Injectable, OnModuleInit } from '@nestjs/common';
import { App } from '@slack/bolt';
import { KarmaService } from './karma.service';
import { WebClient } from '@slack/web-api';
import { GiveKarmaCommand } from '../commands/give-karma.command';
import { CheckKarmaCommand } from '../commands/check-karma.command';
import { KarmaHistoryCommand } from '../commands/history-karma.command';
import { VerifyKarmaCommand } from '../commands/verify-karma.command';
import { HelpKarmaCommand } from '../commands/help-karma.command';
import { TopKarmaCommand } from '../commands/top-karma.command';
import { BurnKarmaCommand } from '../commands/burn-karma.command';
import { SlackCommandHandler } from '../commands/slack.command';
import { BurnKarmaAnonCommand } from '../commands/burn-karma-anon.command ';
import { TeamJoinHandler } from '../handlers/team-join.handler';
import { ReactionGivenHandler } from '../handlers/reaction-added.handler';
import { ReactionBurnHandler } from '../handlers/reaction-burn.handler';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class SlackService implements OnModuleInit {
  private app: App;
  private client: WebClient;

  constructor(
    private karmaService: KarmaService,
    private i18n: I18nService,
  ) {}

  async onModuleInit() {
    this.initializeSlackApp();
    await this.startSlackApp();
    await this.createUsersAndAddKarma();
  }

  private initializeSlackApp() {
    this.app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      socketMode: true,
    });
    this.client = this.app.client;
    this.registerEventHandlers();
  }

  private async startSlackApp() {
    await this.app.start();
    console.log('⚡️ Slack bot is running!');
  }

  private async createUsersAndAddKarma() {
    try {
      const result = await this.client.users.list();
      if (!result.members) return;

      for (const member of result.members) {
        if (this.shouldSkipUser(member)) continue;

        const userExists = await this.karmaService.getUserKarma(member.id);
        if (!userExists) {
          await this.karmaService.addMonthlyKarmaToUser(member.id);
          console.log(`Monthly karma awarded to user <@${member.id}>.`);
        }
      }
    } catch (error) {
      console.error('Error while awarding karma to all users:', error);
    }
  }

  private shouldSkipUser(member: any): boolean {
    return (
      member.is_bot ||
      member.deleted ||
      member.is_app_user ||
      member.is_connector_bot ||
      member.is_workflow_bot ||
      member.id === 'USLACKBOT'
    );
  }

  private registerEventHandlers() {
    new ReactionGivenHandler(
      this.app,
      this.karmaService,
      this.client,
      this.i18n,
    ).register();
    new ReactionBurnHandler(
      this.app,
      this.karmaService,
      this.client,
      this.i18n,
    ).register();

    new TeamJoinHandler(
      this.app,
      this.karmaService,
      this.client,
      this.i18n,
    ).register();
    this.registerKarmaCommands();
  }

  private registerKarmaCommands() {
    this.registerCommand(new GiveKarmaCommand(this.i18n, this.karmaService));
    this.registerCommand(new CheckKarmaCommand(this.i18n, this.karmaService));
    this.registerCommand(new KarmaHistoryCommand(this.i18n, this.karmaService));
    this.registerCommand(new VerifyKarmaCommand(this.i18n, this.karmaService));
    this.registerCommand(new HelpKarmaCommand(this.i18n));
    this.registerCommand(new TopKarmaCommand(this.i18n, this.karmaService));
    this.registerCommand(new BurnKarmaCommand(this.i18n, this.karmaService));
    this.registerCommand(
      new BurnKarmaAnonCommand(this.i18n, this.karmaService),
    );
  }

  private registerCommand(handler: SlackCommandHandler) {
    this.app.command(
      handler.getCommandName(),
      async ({ command, ack, respond }) => {
        await ack();
        const result = await handler.handle(command);
        await respond(result);
      },
    );
  }
}
