import { Injectable } from '@nestjs/common';
import * as web3 from '@solana/web3.js';
var splToken = require('@solana/spl-token');

@Injectable()
export class SolanaService {
  private SOLANA_API: string = process.env.SOLANA_API;
  private myMint;
  private chingariWallet;
  private programId;
  private AIRDROP_FEEPAYER_PRIVATE_KEY;
  private ASSOCIATED_TOKEN_PROGRAM_ID;
  private connection = new web3.Connection(this.SOLANA_API, 'confirmed');

  constructor() {
    this.ASSOCIATED_TOKEN_PROGRAM_ID = new web3.PublicKey(
      process.env.GARI_ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    this.programId = new web3.PublicKey(process.env.PROGRAM_ID);
    this.myMint = new web3.PublicKey(process.env.GARI_TOKEN_ADDRESS);
    this.AIRDROP_FEEPAYER_PRIVATE_KEY = new Uint8Array(
      process.env.AIRDROP_FEEPAYER_PRIVATE_KEY.split(',').map(
        (e: any) => e * 1,
      ),
    );
    this.chingariWallet = web3.Keypair.fromSecretKey(
      this.AIRDROP_FEEPAYER_PRIVATE_KEY,
    );
  }

  async createAssociatedAccount(pubkey) {
    try {
      const publicKey = new web3.PublicKey(pubkey);
      const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
        this.ASSOCIATED_TOKEN_PROGRAM_ID,
        this.programId,
        this.myMint,
        publicKey, //owner
      );
      return associatedAddress;
    } catch (error) {
      throw error;
    }
  }

  async assocaiatedAccountTransaction(associatedAddress, pubkey) {
    const publicKey = new web3.PublicKey(pubkey);
    console.log(
      'this.chingariWallet.publicKey',
      this.chingariWallet.publicKey.toString(),
      'publicKey',
      publicKey.toString(),
      'associatedAddress',
      associatedAddress.toString(),
    );

    const transaction = new web3.Transaction().add(
      splToken.Token.createAssociatedTokenAccountInstruction(
        this.ASSOCIATED_TOKEN_PROGRAM_ID,
        this.programId,
        this.myMint,
        associatedAddress,
        publicKey,
        this.chingariWallet.publicKey,
      ),
    );
    let blockhashObj = await this.connection.getRecentBlockhash('finalized');
    transaction.recentBlockhash = blockhashObj.blockhash;

    transaction.sign(this.chingariWallet);
    let endocdeTransction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    console.log(' ------------------------ ');

    var signature = await this.connection.sendRawTransaction(
      endocdeTransction,
      { skipPreflight: false },
    );

    console.log(signature);

    return signature;
  }
}