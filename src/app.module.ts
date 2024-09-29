import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Karma } from './entities/karma.entity';
import { KarmaService } from './services/karma.service';
import { SlackService } from './services/slack.service';
import { SchedulerService } from './services/scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { KarmaTransaction } from './entities/karma-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'karma.db',
      entities: [Karma, KarmaTransaction],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Karma, KarmaTransaction]),
    ScheduleModule.forRoot(),
  ],
  providers: [KarmaService, SlackService, SchedulerService],
})
export class AppModule {}
