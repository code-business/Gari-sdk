import { v4 as uuidv4 } from 'uuid';
import * as web3 from '@solana/web3.js';
import { Token } from '@solana/spl-token';

import { Injectable, Inject } from '@nestjs/common';
import {
  Repository,
  getConnection,
} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm'
import { RegisterWallet } from './entities/registerWallet.entity';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from "./entities/transaction.entity";
// import { transactions } from 'src/wallet/entity/transactions.entity';

const crypto = require('crypto');
@Injectable()
export class WalletService {

  private SOLANA_API: string = process.env.SOLANA_API;
  private connection = new web3.Connection(this.SOLANA_API, 'confirmed');

  private chingariAccountsPublickey;

  private programId;
  private AIRDROP_FEEPAYER_PRIVATE_KEY;

  private chingariWallet;

  private myMint;

  private ASSOCIATED_TOKEN_PROGRAM_ID;

  private connection1 = new web3.Connection(this.SOLANA_API, 'confirmed');

  constructor(
    @InjectRepository(RegisterWallet) 
    private registerWalletRepository: Repository<RegisterWallet>,

    @InjectRepository(Transaction) 
    private transactions: Repository<Transaction>,

    @InjectRepository(Wallet) 
    private wallet: Repository<Wallet>

  ) {
    
    this.ASSOCIATED_TOKEN_PROGRAM_ID = new web3.PublicKey(
      process.env.GARI_ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    this.programId = new web3.PublicKey(process.env.PROGRAM_ID);

    this.myMint = new web3.PublicKey(process.env.GARI_TOKEN_ADDRESS);

    this.AIRDROP_FEEPAYER_PRIVATE_KEY = new Uint8Array(
      process.env.AIRDROP_FEEPAYER_PRIVATE_KEY.split(',').map((e: any) => e * 1),
    );

    this.chingariWallet = web3.Keypair.fromSecretKey(
    this.AIRDROP_FEEPAYER_PRIVATE_KEY,
    );

    this.chingariAccountsPublickey = new web3.PublicKey(
      process.env.AIRDROP_FEEPAYER_ASSOCIATED_ACCOUNT,
    );
  }
 
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

  async connectWallet(wallet) {
    let data = await this.wallet.save(wallet);
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
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return transactionResponse;
  }

  async deleteWallet(request) {
    return await this.wallet.delete(request);
  }

  async updateTransctions(filter, request) {
    return this.transactions.update({ ...filter }, request);
  }

  async getAssociatedAccount(pubkey) {
    try {
      const publicKey = new web3.PublicKey(pubkey);
      const associatedAddress = await Token.getAssociatedTokenAddress(
        this.ASSOCIATED_TOKEN_PROGRAM_ID, //this is in env
        this.programId,
        this.myMint, //gari
        publicKey, //owner
      );
      return associatedAddress;
    } catch (error) {
      throw error;
    }
  }

  async getAccountInfo(publicKey) {
    return this.connection.getParsedAccountInfo(new web3.PublicKey(publicKey));
  }
  
  async updateWallet(userId, account, amount) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
   await this.wallet.update(
        { userId },
        { tokenAssociatedAccount: account.toString() },
      );
      this.wallet.increment({ userId }, 'balance', amount);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async assocaiatedAccountTransaction(
    associatedAddress,
    pubkey,
    isAssociatedAccount,
    coins,
  ) {
    // let coins = Number(process.env.AIRDROP_AMOUNT);
    const publicKey = new web3.PublicKey(pubkey);
    const instructions = [];
    if (!isAssociatedAccount) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          this.ASSOCIATED_TOKEN_PROGRAM_ID,
          this.programId,
          this.myMint,
          associatedAddress,
          publicKey,
          this.chingariWallet.publicKey,
        ),
      );
    }

    instructions.push(
      Token.createTransferInstruction(
        this.programId,
        this.chingariAccountsPublickey,
        associatedAddress,
        this.chingariWallet.publicKey,
        [],
        coins,
      ),
    );

    const transaction = new web3.Transaction({
      feePayer: new web3.PublicKey(process.env.AIRDROP_FEEPAYER_PUBLIC_KEY),
    }).add(...instructions);
    let blockhashObj = await this.connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhashObj.blockhash;

    transaction.sign(this.chingariWallet);
    let endocdeTransction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    console.log('encodedTransaction', endocdeTransction)
    const signature = await this.connection.sendRawTransaction(
      endocdeTransction,
      { skipPreflight: false },
    );

    return signature;
  }

  findOne(userId) {
    return this.wallet.findOne( {userId} );
  }


  findPubkey(publicKey){
    return this.wallet.findOne( {publicKey} );
  }
  
  async getEncodedTransaction(
    senderWallet,
    receiverPubkeyAta,
    receiverPublicKey,
    coins,
    // comission,
  ) {
    const instructions = [];
    console.log('senderWallet', senderWallet);
    //if external transaction WITHOUT_ASSOCIATED_ACCOUNT

    //transfer instruction
    instructions.push(
      Token.createTransferInstruction(
        this.programId,
        new web3.PublicKey(senderWallet.tokenAssociatedAccount),
        new web3.PublicKey(receiverPubkeyAta), //associatedAddress,
        new web3.PublicKey(senderWallet.publicKey),
        [],
        coins,
      ),
    );
    console.log('instruction', instructions);
    //commission instruction
    // instructions.push(
    //   Token.createTransferInstruction(
    //     this.programId,
    //     new web3.PublicKey(senderWallet.tokenAssociatedAccount),
    //     this.chingariAccountsPublickey,
    //     new web3.PublicKey(senderWallet.publicKey),
    //     [],
    //     comission,
    //   ),
    // );

    // instructions.push(
    //   new web3.TransactionInstruction({
    //     keys: [],
    //     programId: new web3.PublicKey(process.env.MEMO_PROGRAM_ID),
    //     data: Buffer.from(memo, 'utf8'),
    //   }),
    // );

    const transaction = new web3.Transaction({
      feePayer: new web3.PublicKey(process.env.GARI_PUBLIC_KEY),
    }).add(...instructions);

    let blockhashObj = await this.connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhashObj.blockhash;

    let encodedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return encodedTransaction;
  }
  
   find(req) {
    return this.wallet.find(req);
  }
  
  async saveTransaction(data: any) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    // establish real database connection using our new query runner
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const pendingTransactionData = await queryRunner.manager.save(
      Transaction,
      {
        ...data,
      },
    );

    await queryRunner.commitTransaction();
    return pendingTransactionData;
  }

  getDecodedTransction1(endcodedTransction: String) {
    let newEncodedBuffer = Buffer.from(endcodedTransction, 'base64'); // get encoded buffer

    return web3.Transaction.from(newEncodedBuffer);
  }

  async sendNft(newconnectionTransction) {
    // console.log(
    //   JSON.stringify({
    //     method: 'sendNft',
    //     custom: 'newconnectionTransction before partialSign',
    //     newconnectionTransction,
    //   }),
    // );
    newconnectionTransction.partialSign(...[this.chingariWallet]);
    // console.log(
    //   JSON.stringify({
    //     method: 'sendNft',
    //     custom: 'newconnectionTransction after partialSign',
    //     newconnectionTransction,
    //   }),
    // );
    // const fromWallet = web3.Keypair.fromSecretKey(
    //   new Uint8Array([
    //     14, 192, 249, 79, 226, 160, 106, 98, 161, 58, 213, 76, 193, 73, 156,
    //     203, 18, 153, 131, 42, 72, 129, 70, 192, 234, 200, 82, 35, 5, 81, 38,
    //     223, 108, 109, 129, 4, 106, 12, 141, 191, 37, 225, 178, 203, 32, 73,
    //     125, 167, 213, 195, 12, 12, 102, 165, 216, 95, 30, 23, 156, 12, 151, 66,
    //     244, 211,
    //   ]),
    // );
    // newconnectionTransction.partialSign(...[fromWallet]);

    const wireTransaction = newconnectionTransction.serialize({
      requireAllSignatures: true,
      verifySignatures: false,
    });

    // console.log(
    //   JSON.stringify({
    //     method: 'sendNft',
    //     custom: 'wireTransaction after serialize',
    //     wireTransaction,
    //   }),
    // );
    const signature = await this.connection1.sendRawTransaction(
      wireTransaction,
    );
    console.log(
      JSON.stringify({
        // userId,
        message: 'after  sendrawTransaction',
      }),
    );
    // console.log(
    //   JSON.stringify({
    //     method: 'sendNft',
    //     custom: 'after signature',
    //     signature,
    //   }),
    // );
    return signature;
  }
}
