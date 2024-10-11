import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { KarmaService } from './karma.service';
import { Karma } from '../entities/karma.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(
    private karmaService: KarmaService,
    @InjectRepository(Karma)
    private karmaRepository: Repository<Karma>,
  ) {}

  onModuleInit() {}

  @Cron('0 0 1 * *')
  async handleMonthlyKarma() {
    const users = await this.karmaRepository.find();
    for (const user of users) {
      await this.karmaService.addMonthlyKarmaToUser(user.userId);
    }
    console.log('Monthly karma has been credited to all users.');
  }
}
