import { Injectable } from '@nestjs/common';
import * as web3 from '@solana/web3.js';
var splToken = require('@solana/spl-token');

@Injectable()
export class SolanaService { 
    private SOLANA_API: string = process.env.SOLANA_API;
    private myMint;
    private chingariWallet;
    private programId;
    private ASSOCIATED_TOKEN_PROGRAM_ID;
    private connection = new web3.Connection(this.SOLANA_API, 'confirmed');

    constructor() { }
    
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
        var signature = await this.connection.sendRawTransaction(
          endocdeTransction,
          { skipPreflight: false },
        );
    
        return signature;
    }
}