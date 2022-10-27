import { Module , HttpModule} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm'
import { RegisterWallet } from './entities/registerWallet.entity';
import { Transaction } from './entities/transaction.entity';
import { SolanaService } from './solana/solana.service';
import { Wallet } from './entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature(
    [
      RegisterWallet,
      Transaction,
      Wallet,
      HttpModule
    ]
  )],
  exports:[TypeOrmModule],
  controllers: [WalletController],
  providers: [WalletService, SolanaService]
})
export class WalletModule {}
