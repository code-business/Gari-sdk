import { v4 as uuidv4 } from 'uuid';
import * as web3 from '@solana/web3.js';

import * as splToken from '@solana/spl-token';

import { Injectable, Inject } from '@nestjs/common';
import {
  Repository,
  getConnection,
  MoreThanOrEqual,
  In,
  Equal,
  Between,
  LessThanOrEqual,
  LessThan,
} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm'
import { RegisterWallet } from './entities/registerWallet.entity';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from "./entities/transaction.entity";
// import { transactions } from 'src/wallet/entity/transactions.entity';

const crypto = require('crypto');
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(RegisterWallet) 
    private registerWalletRepository: Repository<RegisterWallet>,

    @InjectRepository(Transaction) 
    private transactions: Repository<Transaction>
  ) {}
  // constructor(
  //   @Inject('REGISTER_WALLET_REPOSITORY')
  //   private registerWalletRepository: Repository<RegisterWallet>,
  // ) {}
  async createWallet(wallet) {
    let clientId = uuidv4();
    let encryptedPrivateKey = uuidv4();
    let data = await this.registerWalletRepository.save({
      ...wallet,
      clientId,
      encryptedPrivateKey,
    });
    return data;
  }

  async walletDbTRansaction(walletData, data: object) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    // establish real database connection using our new query runner
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let transactionResponse;
    try {
      await queryRunner.manager.save(Wallet, { ...walletData });

      transactionResponse = await queryRunner.manager.save(Transaction, {
        ...data,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return transactionResponse;
  }

  async deleteWallet(request) {
    return await this.registerWalletRepository.delete(request);
  }

  updateTransctions(filter, request) {
    return this.transactions.update({ ...filter }, request);
  }

  // async connectWallet(wallet) {
  //   let data = await this.appWalletRepository.save(wallet);
  //   return data;
  // }
  // findMany(request) {
  //   return this.appWalletRepository.find(request);
  // }
  // // async findOne(userId) {
  // //   return await this.appWalletRepository.findOne({ userId });
  // // }
  // async find(req) {
  //   return await this.appWalletRepository.find(req);
  // }

  // async saveTransaction(data: any) {
  //   const connection = getConnection();
  //   const queryRunner = connection.createQueryRunner();
  //   // establish real database connection using our new query runner
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   const pendingTransactionData = await queryRunner.manager.save(
  //     transactions,
  //     {
  //       ...data,
  //     },
  //   );

  //   await queryRunner.commitTransaction();
  //   return pendingTransactionData;
  // }

  // async updateWallet(userId, account, amount) {
  //   const connection = getConnection();
  //   const queryRunner = connection.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const data = await this.appWalletRepository.update(
  //       { userId },
  //       { tokenAssociatedAccount: account.toString() },
  //     );
  //     this.appWalletRepository.increment({ userId }, 'balance', amount);

  //     await queryRunner.commitTransaction();
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw new Error(error.message);
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // async getAssociatedAccount(pubkey) {
  //   try {
  //     const publicKey = new web3.PublicKey(pubkey);
  //     const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
  //       this.ASSOCIATED_TOKEN_PROGRAM_ID, //this is in env
  //       this.programId,
  //       this.myMint, //gari
  //       publicKey, //owner
  //     );
  //     return associatedAddress;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  // getAccountInfo(publicKey) {
  //   return this.connection.getParsedAccountInfo(new web3.PublicKey(publicKey));
  // }
  // async assocaiatedAccountTransaction(
  //   associatedAddress,
  //   pubkey,
  //   isAssociatedAccount,
  //   coins,
  // ) {
  //   // let coins = Number(process.env.AIRDROP_AMOUNT);
  //   const publicKey = new web3.PublicKey(pubkey);
  //   const instructions = [];
  //   if (!isAssociatedAccount) {
  //     instructions.push(
  //       splToken.Token.createAssociatedTokenAccountInstruction(
  //         this.ASSOCIATED_TOKEN_PROGRAM_ID,
  //         this.programId,
  //         this.myMint,
  //         associatedAddress,
  //         publicKey,
  //         this.chingariWallet.publicKey,
  //       ),
  //     );
  //   }

  //   instructions.push(
  //     splToken.Token.createTransferInstruction(
  //       this.programId,
  //       this.chingariAccountsPublickey,
  //       associatedAddress,
  //       this.chingariWallet.publicKey,
  //       [],
  //       coins,
  //     ),
  //   );

  //   const transaction = new web3.Transaction({
  //     feePayer: new web3.PublicKey(process.env.AIRDROP_FEEPAYER_PUBLIC_KEY),
  //   }).add(...instructions);
  //   let blockhashObj = await this.connection.getRecentBlockhash('finalized');
  //   transaction.recentBlockhash = blockhashObj.blockhash;

  //   transaction.sign(this.chingariWallet);
  //   let endocdeTransction = transaction.serialize({
  //     requireAllSignatures: false,
  //     verifySignatures: false,
  //   });
  //   var signature = await this.connection.sendRawTransaction(
  //     endocdeTransction,
  //     { skipPreflight: false },
  //   );

  //   return signature;
  // }

  // async getEncodedTransaction(
  //   senderWallet,
  //   receiverPubkeyAta,
  //   receiverPublicKey,
  //   coins,
  //   comission,
  // ) {
  //   const instructions = [];
  //   console.log('senderWallet', senderWallet);
  //   //if external transaction WITHOUT_ASSOCIATED_ACCOUNT

  //   //transfer instruction
  //   instructions.push(
  //     splToken.Token.createTransferInstruction(
  //       this.programId,
  //       new web3.PublicKey(senderWallet.tokenAssociatedAccount),
  //       new web3.PublicKey(receiverPubkeyAta), //associatedAddress,
  //       new web3.PublicKey(senderWallet.publicKey),
  //       [],
  //       coins,
  //     ),
  //   );
  //   console.log('instruction', instructions);
  //   //commission instruction
  //   instructions.push(
  //     splToken.Token.createTransferInstruction(
  //       this.programId,
  //       new web3.PublicKey(senderWallet.tokenAssociatedAccount),
  //       this.chingariAccountsPublickey,
  //       new web3.PublicKey(senderWallet.publicKey),
  //       [],
  //       comission,
  //     ),
  //   );

  //   // instructions.push(
  //   //   new web3.TransactionInstruction({
  //   //     keys: [],
  //   //     programId: new web3.PublicKey(process.env.MEMO_PROGRAM_ID),
  //   //     data: Buffer.from(memo, 'utf8'),
  //   //   }),
  //   // );

  //   const transaction = new web3.Transaction({
  //     feePayer: new web3.PublicKey(process.env.GARI_PUBLIC_KEY),
  //   }).add(...instructions);

  //   let blockhashObj = await this.connection.getRecentBlockhash();
  //   transaction.recentBlockhash = blockhashObj.blockhash;

  //   let encodedTransaction = transaction.serialize({
  //     requireAllSignatures: false,
  //     verifySignatures: false,
  //   });

  //   return encodedTransaction;
  // }

  // getDecodedTransction(endcodedTransction) {
  //   let newEncodedBuffer = Buffer.from(endcodedTransction, 'base64'); // get encoded buffer

  //   return web3.Transaction.from(newEncodedBuffer);
  // }
  
  // async startTransaction(
  //   data: any,
  //   senderWalletId: string,
  //   memoData = undefined,
  // ) {
  //   // get a connection and create a new query runner
  //   let pendingTransactionData;
  //   const connection = getConnection();
  //   const queryRunner = connection.createQueryRunner();
  //   // establish real database connection using our new query runner
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  //   try {
  //     let coinsToBeDeducted = data.chinagriCommission + data.coins;
  //     console.log('first', senderWalletId);
  //     // return;
  //     if (senderWalletId) {
  //       let balanceupdate = await queryRunner.manager.decrement(
  //         AppWallet,
  //         { id: senderWalletId, balance: MoreThanOrEqual(coinsToBeDeducted) },
  //         'balance',
  //         coinsToBeDeducted,
  //       );

  //       if (balanceupdate.affected == 0) {
  //         // console.log('walletID', senderWalletId);

  //         throw new Error('Insufficient balance');
  //       }
  //       console.log('balanceupdate', balanceupdate);
  //     }
  //     pendingTransactionData = await queryRunner.manager.save(transactions, {
  //       ...data,
  //     });
  //     console.log('pendingTransactionData', pendingTransactionData);
      
  //     await queryRunner.commitTransaction();
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     // will finally run after throwing error from cathc function
  //     throw new Error(error.message);
  //   } finally {
  //     await queryRunner.release();
  //   }
  //   return pendingTransactionData;
  // }
}
