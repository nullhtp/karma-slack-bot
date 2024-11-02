import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Karma } from './entities/karma.entity';
import { KarmaService } from './services/karma.service';
import { SlackService } from './services/slack.service';
import { SchedulerService } from './services/scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { KarmaTransaction } from './entities/karma-transaction.entity';
import {
  AcceptLanguageResolver,
  CookieResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'karma.db',
      entities: [Karma, KarmaTransaction],
      synchronize: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        new QueryResolver(['lang', 'l']),
        new HeaderResolver(['x-custom-lang']),
        new CookieResolver(),
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forFeature([Karma, KarmaTransaction]),
    ScheduleModule.forRoot(),
  ],
  providers: [KarmaService, SlackService, SchedulerService],
})
export class AppModule {}
