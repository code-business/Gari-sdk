import { v4 as uuidv4 } from 'uuid';
import * as web3 from '@solana/web3.js';
import { Token } from '@solana/spl-token';

import { Injectable, Inject } from '@nestjs/common';
import {
  Repository,
  getConnection,
  MoreThanOrEqual,
} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm'
import { RegisterWallet } from './entities/registerWallet.entity';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from "./entities/transaction.entity";
import { ETransactionStatus } from 'src/common/enum/status.enum';
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
    let data = await this.wallet.save({
      ...wallet
    });
    return data;
  }

  async connectWallet(wallet) {
    let data = await this.wallet.save(wallet);
    return data;
  }

  // saves walletData into SDK database using queryRunner 
  async saveOnlyWalletData(walletData) {
    // get queryRunner connection
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();

    // establish real database connection using our new query runner
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let queryWalletData;
    try {
      queryWalletData = await queryRunner.manager.save(Wallet, { ...walletData });
      await queryRunner.commitTransaction();
    } catch (error) {
      console.log("error in walletService in saveonlywalletdata function ");
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return queryWalletData;
  }

  async deleteWallet(request) {
    return await this.wallet.delete(request);
  }

  deleteTransactionData(request) {
    return this.transactions.delete(request);
  }

  async updateTransctions(filter, request) {
    return this.transactions.update({ ...filter }, request);
  }

  async getAssociatedAccount(publicKey) {
    try {
      // this gives publickey which web3auth stores internally it is in big N
      const publicKeyOnWeb3 = new web3.PublicKey(publicKey);
      
      // this gives associatedAddress_Of_PublicKeyOnWeb3 on solana. also it is in bigN
      const associatedAddress_Of_PublicKeyOnWeb3 = await Token.getAssociatedTokenAddress(
        this.ASSOCIATED_TOKEN_PROGRAM_ID, //this is in env
        this.programId,
        this.myMint, //gari
        publicKeyOnWeb3, //owner
      );
      return associatedAddress_Of_PublicKeyOnWeb3;
    } catch (error) {
      console.log("error in getAssociatedAccount in SDK backend walletservice", error);
      throw error;
    }
  }

  async getAccountInfo(publicKey) {
    return this.connection.getParsedAccountInfo(new web3.PublicKey(publicKey));
  }

  async updateAssociatedAcc(receiverPublicKey, receiverAssociatedAccount) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
   await this.wallet.update(
        { publicKey :  receiverPublicKey},
        { tokenAssociatedAccount: receiverAssociatedAccount.toString() },
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
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
    const signature = await this.connection.sendRawTransaction(
      endocdeTransction,
      { skipPreflight: false },
    );

    return signature;
  }

  findOne(filter) {
    return this.wallet.findOne(filter);
  }

  findPubkey(publicKey){
    return this.wallet.findOne( {publicKey} );
  }

  async getEncodedTransaction(
    senderPublicKey,
    senderTokenAssociatedAccount,
    receiverPubKey,
    receiverTokenAssociatedAccount,
    coins,
    isAssociatedAccount
) {
  // amount is referred as coins in this function

  // if reciever has no tokenAssociatedAccount, then it creates its tokenAssociatedAccount
  const receiverPublicKey = new web3.PublicKey(receiverPubKey);
  const instructions = []; // transactions instructtions 
  if(!isAssociatedAccount)
  {
    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        this.ASSOCIATED_TOKEN_PROGRAM_ID,
        this.programId,
        this.myMint,
        receiverTokenAssociatedAccount,
        receiverPublicKey,
        this.chingariWallet.publicKey,
      ),
    );
    // senderPublicKey missing
  }

  // create transaction instruction.
  instructions.push(
    Token.createTransferInstruction(
      this.programId,
      new web3.PublicKey(senderTokenAssociatedAccount),
      new web3.PublicKey(receiverTokenAssociatedAccount),
      new web3.PublicKey(senderPublicKey),
      [],
      coins,
    ),
  );

  // add feepayer and recent blockhash obj 
  const transaction = new web3.Transaction({
    feePayer: new web3.PublicKey(process.env.AIRDROP_FEEPAYER_PUBLIC_KEY),
  }).add(...instructions);

  //  console.log('transaction',transaction)
  let blockhashObj = await this.connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhashObj.blockhash;

  let encodedTransaction = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  // convert it in string
  return encodedTransaction.toString('base64');
}
  
   find(req) {
    return this.wallet.find(req);
  }
  
  async startTransaction(data: any,senderWalletId:string) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    // establish real database connection using our new query runner
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    let coinsToBeDeducted = data.coins + data.chinagriCommission;
      if(senderWalletId){

        let balanceupdate = await queryRunner.manager.decrement(
          Wallet,
          { id: senderWalletId, balance: MoreThanOrEqual(coinsToBeDeducted) },
          'balance',
          coinsToBeDeducted,
        );
        
        if (balanceupdate.affected == 0) {
          throw new Error('Insufficient balance');
        }
      }

    const TransactionData = await queryRunner.manager.save(
      Transaction,
      {
        ...data,
      },
    );

    await queryRunner.commitTransaction();
    return TransactionData;
  }

  getAllTransctionInfo(endcodedTransction: String) {
    let newEncodedBuffer = Buffer.from(endcodedTransction, 'base64'); // get encoded buffer
    return web3.Transaction.from(newEncodedBuffer);
  }

  async sendTransaction(newconnectionTransction) {
    newconnectionTransction.partialSign(...[this.chingariWallet]);
    const wireTransaction = newconnectionTransction.serialize({
      requireAllSignatures: true,
      verifySignatures: false,
    });

    const signature = await this.connection1.sendRawTransaction(
      wireTransaction,
    );
    // console.log(
    //   JSON.stringify({
    //     message: 'after  sendrawTransaction',
    //   }),
    // );
    console.log("signature",signature)
    return signature;
  }

  async findTransactionById(request) {
    return this.transactions.findOne(request);
  }

  async findTransctions(request) 
  {
    return this.transactions.findAndCount(request);
  }


  async deleteAndUpdateWalletbalance(
    pendingTransactionId,
    walletId,
    coinsToAdd,
  ) {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();

    // establish our own database connection
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // todo: add status == draft in below query:done
      if(walletId){
        // add again senders decremented balance and save
        await queryRunner.manager.increment(
          Wallet,
          { id: walletId },
          'balance',
          coinsToAdd,
        );
      }
      
      // delete draft transaction row from transaction table since transaction failed
      await queryRunner.manager.delete(Transaction, {
        id: pendingTransactionId,
        status: ETransactionStatus.DRAFT,
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
