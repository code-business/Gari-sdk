import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  BadRequestException,
  Delete,
  Param,
  Headers,
  
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { RegisterAppWalletDto } from './dto/RegisterAppWalletDto,dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { SolanaService } from './solana/solana.service';
import { ETransactionCase, ETransactionStatus } from 'src/common/enum/status.enum';
import { ConnectAppWalletDto, DecodedTransactions, deleteAndUpdateWalletData, EncodedTransactionDTO, GetRecWalletDetailsDto, GetWalletDetailsDto, SaveTransactionData, SendAirdrop, UpdateTransaction } from './dto/AppWallet.dto';
import { keyBy, filter, get } from 'lodash';
import { amountFromBuffer } from 'src/util/amountTobuffer';
const jwt = require('jsonwebtoken')

@ApiTags('Appwallet')
@Controller('Appwallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly solanaService: SolanaService,
  ) {}

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
  
  @Post('connect-wallet')
  async create(@Body() connectAppWalletDto: ConnectAppWalletDto, @Req() req) {
    try {
      let data = {
        ...connectAppWalletDto,
        tokenAssociatedAccount: 'null',
      };
      const wallet = await this.walletService.connectWallet(data);
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
  async createWallet(@Body() body:CreateWalletDto,@Headers() headers,@Req() req) {
    try {
      const token = headers.token
      const clientId = headers.gariclientid

      const { publicKey } = body;
      const decoded = jwt.decode(token, { complete: true })
      const userId = decoded.payload.uid

      const associatedAccount =
        await this.solanaService.createAssociatedAccount(publicKey);
      
        let gariLamports = 1;
      
      const walletData = {
        publicKey,
        userId,
        tokenAssociatedAccount: associatedAccount.toString(),
        balance: 3,
        clientId,
        appName:'ludo'
      }

      const draftTransaction = await this.walletService.walletDbTRansaction(walletData,
        {
          fromUserId: "chingari",
          toUserId: userId,
          status: ETransactionStatus.DRAFT,
          case:'transaction',
          fromPublicKey: process.env.GARI_PUBLIC_KEY,
          toPublicKey: publicKey,
          coins: gariLamports,
          chinagriCommission: 0,
          solanaFeeInLamports: 0,
          totalTransactionAmount: gariLamports,
       });
       console.log('associatedAccount', associatedAccount)
      const isAssociatedAccount = false

      const signature = await this.walletService.assocaiatedAccountTransaction(associatedAccount, publicKey,isAssociatedAccount,
        walletData.balance)
        .catch(async (error) => {
          this.walletService.deleteWallet({
            userId,
          })
          console.log(
            JSON.stringify({
              message: "gfhjvjv",
              error: `${error}`
            })
          );
          
          console.log("Create Wallet Failed");
          throw new Error('Create Wallet Failed');
          
        })  
        console.log('signature', signature)
        await this.walletService.updateTransctions(
          {
            id: draftTransaction.id,
          },
          {
            status: ETransactionStatus.PENDING,
            signature: signature,
          },
      );
      
      console.log("done");
      return {
        signature,
        walletData
      }

    } catch (error) {
      console.log(error);
      
    }
  }
  
  @Post('/airdrop')
  @ApiOperation({
    summary: 'send the airdrop to  receiver public key',
  })
  async sendAirdrop(@Body() sendAirdrop: SendAirdrop) {
    let userId = '6307b6f34a4758e0604ee57b';
    const { publicKey, amount } = sendAirdrop;
    const associatedAccount = await this.walletService.getAssociatedAccount(
      publicKey,
    );
    const accountInfo: any = await this.walletService.getAccountInfo(
      associatedAccount.toString(),
    );

    let isAssociatedAccount = true;

    if (!accountInfo.value) {
      isAssociatedAccount = false;
    }

    const signature = await this.walletService.assocaiatedAccountTransaction(
      associatedAccount,
      publicKey,
      isAssociatedAccount,
      amount,
    );
    let wallet;
    if (signature) {
      wallet = await this.walletService.updateWallet(
        userId,
        associatedAccount,
        amount,
      );
    }

    const data = { signature };

    return {
      code: 200,
      error: null,
      message: 'Success',
      data: data,
    };
  }
  
  @Post('getEncodedTransaction')
  async getEncodedTransaction(@Body() body: EncodedTransactionDTO,@Headers() headers) {
    try {
      const token = headers.token
      const decoded = jwt.decode(token, { complete: true })
      const userId = decoded.payload.uid
      const { senderPubkeyAta ,receiverPubkeyAta, senderPublicKey, amount } = body;

      // const senderWallet = await this.walletService.findOne(userId);
      // console.log('senderWallet', senderWallet)

      const encodedTransaction =
        await this.walletService.getEncodedTransaction(
          senderPubkeyAta,
          receiverPubkeyAta,
          senderPublicKey,
          amount,
        );
      return encodedTransaction;
    } catch (error) {
      console.log('error', error);
    }
  }

  @Post('decodeEncodedTransaction')
  async decodeEncodedTransaction(@Body() body: DecodedTransactions, @Req() req,@Headers() header) {
    try {
      const token = header.token
      const decoded = jwt.decode(token, { complete: true })
      const userId = decoded.payload.uid
      // let userId = 600;
      const { encodedTransaction } = body;
      const decodedTransction =
        this.walletService.getDecodedTransction1(encodedTransaction);
      console.log('decodedTransction', decodedTransction)
     const senderWallet = await this.walletService.find({
      userId,
    });

      let senderWalletPublicKey = get(
        filter(decodedTransction.instructions[0].keys, function (elt) {
          // console.log(
          //   'elt',
          //   elt.isSigner,
          //   elt.isWritable,
          //   elt.pubkey.toString(),
          // );
          return (
            elt.isSigner &&
            !elt.isWritable &&
            elt.pubkey.toString() != process.env.GARI_ASSOCIATED_ACCOUNT
          );
        }),
        '[0].pubkey',
        undefined,
      );
      console.log('senderWalletPublicKey', senderWalletPublicKey.toString());

      if (!senderWalletPublicKey) {
        throw new BadRequestException('Invalid sender Wallet details');
      }

      let receiverWalletAssociatedPublickey = get(
        filter(decodedTransction.instructions[0].keys, function (elt) {
          // console.log(
          //   'elt',
          //   elt.isSigner,
          //   elt.isWritable,
          //   elt.pubkey.toString(),
          // );
          return (
            !elt.isSigner &&
            elt.isWritable &&
            elt.pubkey.toString() != senderWallet[0].tokenAssociatedAccount.toString()
          );
        }),
        '[0].pubkey',
        undefined,
      );

      console.log(
        'receiverWalletAssociatedPublickey',
        receiverWalletAssociatedPublickey.toString(),
      );

      if (!receiverWalletAssociatedPublickey) {
        throw new BadRequestException('Invalid receiver Wallet details');
      }

      const walletData = await this.walletService.find({
        tokenAssociatedAccount: receiverWalletAssociatedPublickey.toString(),
      });
      console.log('walletData', walletData)

      if (!walletData) {
        return {
          code: 404,
          error: null,
          message: 'Receiver Wallet  not found',
        };
      }

      const amountBuffer = get(
        decodedTransction,
        'instructions[0].data',
        undefined,
      );
      const amount = amountFromBuffer(amountBuffer);
      console.log('amount', amount)
      if (!amountBuffer) {
        throw new Error('Amount is required.');
      }

      // const memoDecrypt = JSON.parse(decryptTextAES(memo.toString()));
      // if (get(memoDecrypt, 'type', undefined) != 'nft_reward_transfer') {
      //   throw new Error('Invalid transactions');
      // }
      // console.log('memoDecrypt', memoDecrypt);
      let transaction: any = {
        status: ETransactionStatus.DRAFT,
        case: ETransactionCase.TRANSACTION,
        coins: amount,
        totalTransactionAmount: amount,
        fromPublicKey: senderWalletPublicKey.toString(),
        toPublicKey:walletData[0].publicKey.toString(),
        fromUserId: userId,
        toUserId: walletData[0].userId,
        chinagriCommission: 0,
        // meta: memoDecrypt,
      };
      console.log('transaction', transaction);

     const pendingTransactionData = await this.walletService.startTransaction(transaction,walletData[0].id);

      const signature = await this.walletService
        .sendTransaction(decodedTransction)
        .catch(async (error) => {
          // await this.walletService.deleteAndUpdateWalletbalance(
          //   pendingTransactionData.id,
          //   undefined,
          //   undefined,
          //   undefined,
          //   pendingTransactionData,
          // );
          throw new Error(error);
        });
      console.log('signature=>', signature);

      await this.walletService.updateTransctions(
        {
          id: pendingTransactionData.id,
        },
        {
          status: ETransactionStatus.PENDING,
          signature: signature,
        },
      );

      return {
        code: 200,
        error: null,
        message: 'success',
        signature,
      };
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: 'Error',
      };
    }
  }

  @Get('getWalletDetails')
  async getWalletDetails(@Headers() headers) {
    const token = headers.token;
    const clientId = headers.gariclientId
    const decoded = jwt.decode(token, { complete: true })
    const userId = decoded.payload.uid
    try {
      if(userId != undefined){
        const wallet = await this.walletService.findOne({userId});
         if(!wallet){
          return {
            code: 400,
            error: null,
            userExist: false,
            message: 'User Not Found',
          };
         }

          return {
            code: 200,
            error: null,
            userExist: true,
            message: 'Success',
            data: wallet,
          };
        
      }
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: 'Error',
      };
    }
  }

  @Post('getRecWalletDetails')
  async getRecWalletDetails(@Body() body: GetRecWalletDetailsDto) {
    const {publicKey} = body;
    try {
      if(publicKey != undefined){
        const wallet = await this.walletService.findPubkey(publicKey);
         if(!wallet){
          return {
            code: 200,
            error: null,
            message: 'PublicKey Not Found',
          };
         }else{
          return {
            code: 200,
            error: null,
            message: 'Success',
            data: wallet,
          };
        }
      }
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: 'Error',
      };
    }
  }

  // @Post('saveTransactions')
  // async saveTransactions(@Body() data:SaveTransactionData, @Param('id') id:string) {
  //   try {
  //     let transactionData = await this.walletService.saveTransaction(data,id);
  //        console.log('transactionData=>', transactionData)
  //        if(!transactionData){
  //         return {
  //           code: 500,
  //           error: null,
  //           message: 'Data not saved',
  //         };
  //        }else{
  //         return {
  //           code: 200,
  //           error: null,
  //           message: 'Success',
  //           data: transactionData,
  //         };
          
  //     }
  //   } catch (error) {
  //     return {
  //       code: 400,
  //       error: error.message,
  //       message: 'Error',
  //     };
  //   }
  // }

  // @Post('deleteAndUpdateWalletData')
  // async deleteAndUpdateWalletData(@Body() body:deleteAndUpdateWalletData){
  //  try {
  //     const { pendingTransactionId, walletId, coinsToAdd } = body
  //     console.log('body', body)
  //     const data = await this.walletService.deleteAndUpdateWalletbalance(pendingTransactionId, walletId, coinsToAdd)
  //     console.log('data', data)
  //     return {
  //       code: 200,
  //           error: null,
  //           message: 'Success',
  //           data: data,
  //     }
  //  } catch (error) {
  //   return {
  //     code: 400,
  //     error: error.message,
  //     message: 'Error',
  //   };
  //  }
  // }

  // @Post('updateTranSactionData/:id') 
  // async updateTranSactionData(@Body() Body:UpdateTransaction,@Param('id') id:string){
  //   try { 
  //     const { signature } = Body
  //     console.log('id=>', id)
  //     console.log('signature=>', signature)
  //     const data = await this.walletService.updateTransctions(
  //       {
  //         id: id,
  //       },
  //       {
  //         status: ETransactionStatus.PENDING,
  //         signature: signature,
  //       },
  //   );
  //   return {
  //     code: 200,
  //     error: null,
  //     message: 'Success',
  //     data: data,
  //   };

  //   } catch (error) {
      
  //   }
  // }

  // @Delete(':id')
  // async deleteData(@Param('id') id:string){
  //  try {
  //      await this.walletService.deleteWallet({userid:id})
  //  } catch (error) {
  //   return {
  //     code: 400,
  //     error: error.message,
  //     message: 'Error',
  //   };
  //  }
  // }

}
