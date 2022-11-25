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
import { Not, In, Between, MoreThan } from 'typeorm';
import { WalletService } from './wallet.service';
import { RegisterAppWalletDto } from './dto/RegisterAppWalletDto,dto';
import { GetTransctionByUser } from './dto/getTransaction.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { SolanaService } from './solana/solana.service';
import { ETransactionCase, ETransactionStatus } from 'src/common/enum/status.enum';
import { DecodedTransactions, EncodedTransactionDTO, GetRecWalletDetailsDto, SendAirdropDto } from './dto/AppWallet.dto';
import { filter, get } from 'lodash';
import { amountFromBuffer } from 'src/util/amountTobuffer';
const jwt = require('jsonwebtoken');

@ApiTags('Appwallet')
@Controller('Appwallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService, //private readonly solanaService: SolanaService,
  ) {}

  // for registering appWallet(ludo) i.e client of chingari
  @Post('register-wallet')
  async registerWallet(@Body() registerAppWalletDto: RegisterAppWalletDto) {
    try {
      let data = {
        ...registerAppWalletDto,
      };

      const wallet = await this.walletService.saveRegisterWalleteData(data);
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

  // saves new ludo user wallet without its tokenAssociatedAccount
  @Post('newUserWallet')
  async newUserSaveWallet(@Headers() header, @Body() body: CreateWalletDto) {
    try {
      // extract userId
      const token = header.token;
      const decoded = jwt.decode(token, { complete: true });
      const userId = decoded.payload.uid;

      // publicKey : created during web3Auth initialization
      // clientId : ludo clientId
      const clientId = header.gariclientid;
      const { publicKey } = body;

      const walletData = {
        userId,
        clientId,
        appName: 'ludo',
        publicKey,
        balance: 0,
      };

      const newWalletData = await this.walletService.saveWalletData(
        walletData,
      );
      // return newWalletData;
      return {
        code: 200,
        error: null,
        message: 'Success',
        newWalletData,
      };
    } catch (error) {
      console.log('error in newUserSaveWallet in SDK backend api ', error);
      return new Error(error);
    }
  }

  @Post('/airdrop')
  @ApiOperation({
    summary: 'send the airdrop to  receiver public key',
  })
  async sendAirdrop(@Headers() headers, @Body() body: SendAirdropDto) {
    try {
    // extract userid   
    const token = headers.token;
    const decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.uid;

    // publickey and airdropAmount 
    const { publicKey, airdropAmount } = body;
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

    // before doing actual transaction save as a draft in transaction table
    let draftData: any = {
      status: ETransactionStatus.DRAFT,
      case: ETransactionCase.AIRDROP,
      coins: airdropAmount,
      totalTransactionAmount: airdropAmount,
      fromPublicKey: process.env.GARI_PUBLIC_KEY,
      toPublicKey : publicKey,
      fromUserId: 'chingari',
      toUserId: userId,
      chinagriCommission: 0, // will be dynamic
      //clientId,
      //appName // not required
      // meta: memoDecrypt,
    };

    const signature = await this.walletService.assocaiatedAccountTransaction(
      associatedAccount,
      publicKey,
      isAssociatedAccount,
      airdropAmount,
    );

    if (signature) {
      await this.walletService.updateWallet(
        userId,
        associatedAccount,
        airdropAmount,
      );
    }

    return {
      code: 200,
      error: null,
      message: 'Success',
      signature,
    };
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: `Error`,
      };
    }
    
  }

  @Post('getEncodedTransaction')
  async getEncodedTransaction(@Headers() headers, @Body() body : EncodedTransactionDTO)
  {
    try
    {
      const { receiverPublicKey, amountToTransfer } = body;

      // extract sender userid 
      const senderJwtToken = headers.token;
      const decoded = jwt.decode(senderJwtToken, { complete: true });
      const userId = decoded.payload.uid;

      // fetch sender wallet details from SDK database
      const senderWalletDetails = await this.walletService.findOne({userId}); // add another argument client id
      const senderPublicKey = senderWalletDetails.publicKey;
      const senderTokenAssociatedAccount = senderWalletDetails.tokenAssociatedAccount;
      
      //if sender doesnt have sufficient amount to transfer then transaction cant happen
      if(+senderWalletDetails.balance <= amountToTransfer + (+process.env.CHINGARI_COMISSION) )
      {
        throw new Error;
      }

      // fetch receiverTokenAssociatedAccount from web3 method
      let receiverTokenAssociatedAccount: any =
        await this.walletService.getAssociatedAccount(receiverPublicKey);

      // verify whether its associatedAccount is present or not
      const accountInfo = await this.walletService.getAccountInfo(
        receiverTokenAssociatedAccount.toString(),
      );

      let isAssociatedAccountOfReceiver = true;
      if (!accountInfo.value) {
        isAssociatedAccountOfReceiver = false;
      }

      // save associatedAccount of receiver
      await this.walletService.updateAssociatedAcc(
        receiverPublicKey,
        receiverTokenAssociatedAccount,
      );

      // create encodedTransaction and send
      const encodedTransaction = await this.walletService.getEncodedTransaction(
        senderPublicKey,
        senderTokenAssociatedAccount,
        receiverPublicKey,
        receiverTokenAssociatedAccount,
        amountToTransfer,
        isAssociatedAccountOfReceiver
      );
      return encodedTransaction;
    }
    catch(error)
    { 
      console.log('error in getEncodedTransaction api in SDK backend', error);
      return {
        code: 400,
        error: error.message,
        message: `Error`,
      };
    }
  }

  // only decodes encoded transaction (i.e starts actual transaction )
  @Post('startTransactions')
  async startTransactions(
    @Headers() header,
    @Body() body: DecodedTransactions,
  ) {
    try {
      const { encodedTransaction } = body;

      // extract senders(ludo user) userId
      const token = header.token;
      const decoded = jwt.decode(token, { complete: true });
      const userId = decoded.payload.uid;
      const appName = decoded.payload.appName;
      const clientId = header.gariclientid;
    
      // getAllTransctionInfo just converts buffered encodedTransaction i.e returns all information about transactions
      const decodedTransction = this.walletService.getAllTransctionInfo(encodedTransaction);

      // fetch sender wallet details from SDK databse
      const senderWallet = await this.walletService.find({ userId});

      const instructionIndex = decodedTransction.instructions.length > 1 ? 1 : 0;

      let senderWalletPublicKey = get(
        filter(
          decodedTransction.instructions[instructionIndex].keys,
          function (elt) {
            return (
              elt.isSigner &&
              !elt.isWritable &&
              elt.pubkey.toString() != process.env.GARI_ASSOCIATED_ACCOUNT
            );
          },
        ),
        '[0].pubkey',
        undefined,
      );
      // senderpublickey isSigner is true and isWritable is false

      // if senderPublicKey not found throw error
      if (!senderWalletPublicKey) {
        throw new BadRequestException(
          'Invalid sender Wallet details in SDK backend decodeEncodedTransaction api',
        );
      }

      let receiverWalletAssociatedPublickey = get(
        filter(
          decodedTransction.instructions[instructionIndex].keys,
          function (elt) {
            // console.log(
            //   'elt',
            //   elt.isSigner,
            //   elt.isWritable,
            //   elt.pubkey.toString(),
            // );
            return (
              !elt.isSigner &&
              elt.isWritable &&
              elt.pubkey.toString() !=
                senderWallet[0].tokenAssociatedAccount.toString()
            );
          },
        ),
        '[0].pubkey',
        undefined,
      );

      // if receiverPublicKey not found throw error
      if (!receiverWalletAssociatedPublickey) {
        throw new BadRequestException('Invalid receiver Wallet details');
      }

      const walletData = await this.walletService.find({
        tokenAssociatedAccount: receiverWalletAssociatedPublickey.toString(),
      });

      if (!walletData) {
        return {
          code: 404,
          error: null,
          message: 'Receiver Wallet  not found',
        };
      }

      const amountBuffer = get(
        decodedTransction,
        `instructions[${instructionIndex}].data`,
        undefined,
      );
      const amount = amountFromBuffer(amountBuffer);

      if (!amountBuffer) {
        throw new Error('Amount is required.');
      }

      let transaction: any = {
        status: ETransactionStatus.DRAFT,
        case: ETransactionCase.TRANSACTION,
        coins: amount,
        totalTransactionAmount: amount,
        fromPublicKey: senderWalletPublicKey.toString(),
        toPublicKey: walletData[0].publicKey.toString(),
        fromUserId: userId,
        toUserId: walletData[0].userId,
        chinagriCommission: 0, // will be dynamic
        clientId,
        appName // not required
        // meta: memoDecrypt,
      };
      console.log('transaction', transaction);
      console.log("senderWallet[0].id ", senderWallet[0].id);

      // draft transaction
      // after getting transaction signature status will be updated to pending
      const draftTransactionData = await this.walletService.startTransaction(transaction, senderWallet[0].id);
      // cron job add
      const signature = await this.walletService
        .sendTransaction(decodedTransction)
        .catch(async (error) => {
          await this.walletService.deleteAndUpdateWalletbalance(
            draftTransactionData.id,
            senderWallet[0].id,
            amount,
          );
          throw new Error(error);
        });
      console.log('signature=>', signature);

      // update transaction status from draft to pending
      await this.walletService.updateTransctions(
        {
          id: draftTransactionData.id,
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
  async getWalletDetails(@Headers() header) {
    const token = header.token;
    const clientId = header.gariclientId;
    const decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.uid;
    try {
      if (userId != undefined) {
        const wallet = await this.walletService.findOne({ userId });
        if (!wallet) {
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
        userExist: false,
        message: 'User Not Found',
      };
    }
  }

  @Get('getTransactionById/:id')
  async getTransactionById(@Headers() header, @Param('id') transactionId: string, @Req() req) {
    // extract userId
    const token = header.token;
    const decoded = jwt.decode(token, { complete: true });
    const userId = decoded.payload.uid;
    try {
      // first fetch whether transaction data is available
      let transactionData: any = await this.walletService.findTransactionById({
        where: [
          {
            id: transactionId,
            toUserId: userId,
          },
          { fromUserId: userId, id: transactionId },
        ],
      });

      if (!transactionData) {
        return {
          code: 400,
          error: 'error',
          message: 'Transaction not found',
        };
      }

      return {
        code: 200,
        error: null,
        message: 'Success',
        data: transactionData,
      };
    } catch (err) {
      return {
        code: 400,
        error: err.message,
        message: 'Error',
      };
    }
  }

  @Post('get/transactions')
  async getTransactions(
    @Body() getTransctionByUser: GetTransctionByUser
  ) {
    try {
      // chingari registered clients will access this api with their respective ids

      // extract filter, page, limits from body
      let { page, limit, sorting, filter } = getTransctionByUser;
      const clientId = filter.clientId;
      const appName = filter.appName;

      // if filter is an array throw error
      if (Array.isArray(filter)) {
        throw new Error('filter should be an object ');
      }

      const skip = (page - 1) * limit;
      const transactionData: any = await this.walletService.findTransctions({
        where: { clientId, appName },
        order: { created_at: sorting },
        take: limit, //limit
        skip,
      });

      return {
        code: 200,
        error: null,
        message: 'Success',
        data: transactionData,
      };
    } catch (error) {
      return {
        code: 400,
        error: error.message,
        message: 'Error ',
      };
    }
  }
}
