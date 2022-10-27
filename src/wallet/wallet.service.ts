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

  private SOLANA_API: string = process.env.SOLANA_API;
  private connection = new web3.Connection(this.SOLANA_API, 'confirmed');

  private chingariAccountsPublickey;

  private programId;
  private AIRDROP_FEEPAYER_PRIVATE_KEY;

  private chingariWallet;

  private myMint;

  private myToken;

  private ASSOCIATED_TOKEN_PROGRAM_ID;

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

  async updateTransctions(filter, request) {
    return this.transactions.update({ ...filter }, request);
  }

  async getAssociatedAccount(pubkey) {
    try {
      const publicKey = new web3.PublicKey(pubkey);
      const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
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
        splToken.Token.createAssociatedTokenAccountInstruction(
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
      splToken.Token.createTransferInstruction(
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
    let blockhashObj = await this.connection.getRecentBlockhash('finalized');
    transaction.recentBlockhash = blockhashObj.blockhash;

    transaction.sign(this.chingariWallet);
    let endocdeTransction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    var signature = await this.connection.sendRawTransaction(
      endocdeTransction,
      { skipPreflight: false },
    );

    return signature;
  }

  async findOne(userId) {
    return await this.wallet.findOne( userId );
  }

  async getEncodedTransaction(
    senderWallet,
    receiverPubkeyAta,
    receiverPublicKey,
    coins,
    comission,
  ) {
    const instructions = [];
    console.log('senderWallet', senderWallet);
    //if external transaction WITHOUT_ASSOCIATED_ACCOUNT

    //transfer instruction
    instructions.push(
      splToken.Token.createTransferInstruction(
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
    instructions.push(
      splToken.Token.createTransferInstruction(
        this.programId,
        new web3.PublicKey(senderWallet.tokenAssociatedAccount),
        this.chingariAccountsPublickey,
        new web3.PublicKey(senderWallet.publicKey),
        [],
        comission,
      ),
    );

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


}
