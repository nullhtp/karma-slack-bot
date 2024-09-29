import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KarmaService } from './karma.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(private karmaService: KarmaService) {}

  onModuleInit() {}

  @Cron('0 0 1 * *')
  async handleMonthlyKarma() {
    await this.karmaService.addMonthlyKarma();
    console.log('Ежемесячная карма начислена всем пользователям.');
  }
}
