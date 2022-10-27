import { Module , HttpModule} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm'
import { RegisterWallet } from './entities/registerWallet.entity';
import { Transaction } from './entities/transaction.entity';
import { SolanaService } from './solana/solana.service';

@Module({
  imports: [TypeOrmModule.forFeature(
    [
      RegisterWallet,
      HttpModule
    ]
  )],
  exports:[TypeOrmModule],
  controllers: [WalletController],
  providers: [WalletService, SolanaService]
})
export class WalletModule {}
