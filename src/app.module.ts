import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegisterWallet } from './wallet/entities/registerWallet.entity';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import constants from './constants';
import { WalletModule } from './wallet/wallet.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: constants.DB_LOCAL_HOST,
      port: parseInt(constants.DB_PORT),
      username: 'postgres',
      password: constants.DB_LOCAL_PASSWORD,
      database: constants.DB_LOCAL_DATABASE,
      entities: [RegisterWallet ],
      synchronize: true,
    }),
    WalletModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
