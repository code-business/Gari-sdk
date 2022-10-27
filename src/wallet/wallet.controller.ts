import {
  Controller,
  Get,
  Post,
  Body,
  Req,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RegisterAppWalletDto } from './dto/RegisterAppWalletDto,dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { SolanaService } from './solana/solana.service';
import { ETransactionStatus } from 'src/common/enum/status.enum';

@Controller('app-wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly solanaService: SolanaService,
  ) {}

  @ApiTags('app-wallet')
  @Post('register-wallet')
  async registerWallet(@Body() registerAppWalletDto: RegisterAppWalletDto) {
    try {
      let data = {
        ...registerAppWalletDto,
      };
      const wallet = await this.walletService.createWallet(data);
      console.log('wallet', wallet);
      return {
        code: 200,
        error: null,
        message: 'Success',
        data: wallet,
      };
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: 'Error',
      };
    }
  }
  
  @Post('create')
  async createWallet(@Body() body:CreateWalletDto, @Req() req) {
    try {
      const userId = req.decoded._id;
      const { publicKey } = body;

      const associatedAccount =
        await this.solanaService.createAssociatedAccount(publicKey);
      
        let gariLamports = 1;

        //  this is just for testing
        if (process.env.ENVIRONMENT != 'PRODUCTION') {
          gariLamports = 1000000;
        }
      
      const walletData = {
        publicKey,
        userId,
        tokenAssociatedAccountpublickey: associatedAccount.toString(),
        balance: 0,
      }

      const draftTransaction = await this.walletService.walletDbTRansaction(walletData,
        {
          fromUserId: "",
          toUserId: userId,
          status: ETransactionStatus.DRAFT,
          fromPublicKey: process.env.GARI_PUBLIC_KEY,
          toPublicKey: publicKey,
          coins: gariLamports,
          chinagriCommission: 0,
          solanaFeeInLamports: 0,
          totalTransactionAmount: gariLamports,
       });

      const signature = await this.solanaService.assocaiatedAccountTransaction(associatedAccount, publicKey)
        .catch(async (error) => {
          this.walletService.deleteWallet({
            userId,
          })

          console.log("Create Wallet Failed");
          throw new Error('Create Wallet Failed');
          
        })  
      
        await this.walletService.updateTransctions(
          {
            id: draftTransaction.id,
          },
          {
            status: ETransactionStatus.PENDING,
            signature: signature,
          },
        );

    } catch (error) {
      console.log(error);
      
    }
  }

  // @ApiTags('app-wallet')
  // @Post('connect-wallet')
  // async create(@Body() connectAppWalletDto: ConnectAppWalletDto, @Req() req) {
  //   // let userId = 'akshay';
  //   try {
  //     let data = {
  //       ...connectAppWalletDto,
  //       tokenAssociatedAccount: 'null',
  //     };

  //     const wallet = await this.appWalletService.connectWallet(data);
  //     console.log('wallet', wallet);
  //     return {
  //       code: 200,
  //       error: null,
  //       message: 'Success',
  //       data: wallet,
  //     };
  //   } catch (error) {
  //     this.logger.error(
  //       JSON.stringify({
  //         // userId,
  //         method: 'createWallet',
  //         custom: 'create wallet final error',
  //       }),
  //     );
  //     this.logger.error(
  //       JSON.stringify({ method: 'createWallet', error: `${error}` }),
  //     );
  //     return {
  //       code: 400,
  //       error: error.message,
  //       message: 'Error',
  //     };
  //   }
  // }
  // @ApiTags('app-wallet')
  // @Post('/airdrop')
  // @ApiOperation({
  //   summary: 'send the airdrop to  receiver public key',
  // })
  // async sendAirdrop(@Body() sendAirdrop: SendAirdrop) {
  //   let userId = 'akshay';
  //   const { publicKey, amount } = sendAirdrop;
  //   const associatedAccount = await this.appWalletService.getAssociatedAccount(
  //     publicKey,
  //   );
  //   const accountInfo: any = await this.appWalletService.getAccountInfo(
  //     associatedAccount.toString(),
  //   );

  //   let isAssociatedAccount = true;

  //   if (!accountInfo.value) {
  //     isAssociatedAccount = false;
  //   }

  //   const signature = await this.appWalletService.assocaiatedAccountTransaction(
  //     associatedAccount,
  //     publicKey,
  //     isAssociatedAccount,
  //     amount,
  //   );
  //   let wallet;
  //   if (signature) {
  //     wallet = await this.appWalletService.updateWallet(
  //       userId,
  //       associatedAccount,
  //       amount,
  //     );
  //   }

  //   const data = { signature };

  //   return {
  //     code: 200,
  //     error: null,
  //     message: 'Success',
  //     data: data,
  //   };
  // }

  // @ApiTags('app-wallet')
  // @Post('getEncodedTransaction')
  // async getEncodedTransaction(@Body() body: EncodedTransactionDTO) {
  //   try {
  //     // const { publicKey } = body;
  //     let userId = 'akshay';
  //     let APP_PUBLIC_KEY = 'HxnzKXSCR7CZ37qGzM1pWmuPcwwJXGdNph34yH2mpgm7';

  //     let APP_ASSOC_ACCOUNT = 'FpDS4vzViuPBSxdMTaZREKXNZ1BF8Lsj47TAmDG1Kj4g';
  //     let coins = 1234;
  //     let comission = 10;

  //     const senderWallet = await this.appWalletService.findOne(userId);

  //     const encodedTransaction =
  //       await this.appWalletService.getEncodedTransaction(
  //         senderWallet,
  //         APP_ASSOC_ACCOUNT,
  //         APP_PUBLIC_KEY,
  //         coins,
  //         comission,
  //       );
  //     return encodedTransaction.toString('base64');
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // }

  // @ApiTags('app-wallet')
  // @Post('decodeEncodedTransaction')
  // async decodeEncodedTransaction(@Body() body: BuyAppDto, @Req() req) {
  //   try {
  //     // let userId = req.decoded._id;
  //     const { encodedTransaction } = body;
  //     const decodedTransction =
  //       this.solanaNftService.getDecodedTransction1(encodedTransaction);
  //     // console.log('decodedTransction=>', decodedTransction);
  //     //  console.log(decodedTransction.instructions.length)get
  //     let senderWalletPublicKey = get(
  //       filter(decodedTransction.instructions[0].keys, function (elt) {
  //         // console.log(
  //         //   'elt',
  //         //   elt.isSigner,
  //         //   elt.isWritable,
  //         //   elt.pubkey.toString(),
  //         // );
  //         return (
  //           elt.isSigner &&
  //           !elt.isWritable &&
  //           elt.pubkey.toString() != process.env.GARI_ASSOCIATED_ACCOUNT
  //         );
  //       }),
  //       '[0].pubkey',
  //       undefined,
  //     );
  //     console.log('senderWalletPublicKey', senderWalletPublicKey.toString());

  //     if (!senderWalletPublicKey) {
  //       throw new BadRequestException('Invalid sender Wallet details');
  //     }

  //     let receiverWalletAssociatedPublickey = get(
  //       filter(decodedTransction.instructions[0].keys, function (elt) {
  //         // console.log(
  //         //   'elt',
  //         //   elt.isSigner,
  //         //   elt.isWritable,
  //         //   elt.pubkey.toString(),
  //         // );
  //         return (
  //           !elt.isSigner &&
  //           elt.isWritable &&
  //           elt.pubkey.toString() != senderWalletPublicKey
  //         );
  //       }),
  //       '[0].pubkey',
  //       undefined,
  //     );
  //     console.log(
  //       'receiverWalletAssociatedPublickey',
  //       receiverWalletAssociatedPublickey.toString(),
  //     );

  //     if (!receiverWalletAssociatedPublickey) {
  //       throw new BadRequestException('Invalid receiver Wallet details');
  //     }

  //     const walletData = await this.appWalletService.find({
  //       tokenAssociatedAccount: receiverWalletAssociatedPublickey.toString(),
  //     });

  //     if (!walletData) {
  //       return {
  //         code: 404,
  //         error: null,
  //         message: 'Receiver Wallet  not found',
  //       };
  //     }

  //     // const memo = get(decodedTransction, 'instructions[0].data', undefined);
  //     const amountBuffer = get(
  //       decodedTransction,
  //       'instructions[1].data',
  //       undefined,
  //     );
  //     const amount = amountFromBuffer(amountBuffer);

  //     if (!amountBuffer) {
  //       throw new Error('Amount is required.');
  //     }

  //     // const memoDecrypt = JSON.parse(decryptTextAES(memo.toString()));
  //     // if (get(memoDecrypt, 'type', undefined) != 'nft_reward_transfer') {
  //     //   throw new Error('Invalid transactions');
  //     // }
  //     // console.log('memoDecrypt', memoDecrypt);
  //     let transaction: any = {
  //       status: ETransactionStatus.DRAFT,
  //       case: ETransactionCase.AIRDROP,
  //       coins: amount,
  //       totalTransactionAmount: amount,
  //       fromPublicKey: senderWalletPublicKey.toString(),
  //       toPublicKey: receiverWalletAssociatedPublickey.toString(),
  //       fromUserId: 'chingari',
  //       toUserId: walletData[0].userId,
  //       chinagriCommission: 0,
  //       // meta: memoDecrypt,
  //     };
  //     console.log('transaction', transaction);

  //     await this.appWalletService.saveTransaction(transaction);

  //     const signature = await this.solanaNftService
  //       .sendNft(decodedTransction)
  //       .catch(async (error) => {
  //         // await this.walletService.deleteAndUpdateWalletbalance(
  //         //   pendingTransactionData.id,
  //         //   undefined,
  //         //   undefined,
  //         //   undefined,
  //         //   pendingTransactionData,
  //         // );
  //         throw new Error(error);
  //       });
  //     console.log('signature=>', signature);

  //     // await this.walletService.updateTransctions(
  //     //   {
  //     //     id: pendingTransactionData.id,
  //     //   },
  //     //   {
  //     //     status: ETransactionStatus.PENDING,
  //     //     signature: signature,
  //     //   },
  //     // );
  //     const data = {
  //       transactionSignature: signature,
  //     };

  //     return {
  //       code: 200,
  //       error: null,
  //       message: 'success',
  //       data,
  //     };
  //   } catch (error) {
  //     return {
  //       code: 400,
  //       error: error.message,
  //       message: 'Error',
  //     };
  //   }
  // }

}
