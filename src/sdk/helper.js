import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();
var splToken = require('@solana/spl-token');
import * as web3 from '@solana/web3.js';

const ASSOCIATED_TOKEN_PROGRAM_ID = new web3.PublicKey(
  process.env.GARI_ASSOCIATED_TOKEN_PROGRAM_ID,
);
const programId = new web3.PublicKey(process.env.PROGRAM_ID);
const myMint = new web3.PublicKey(process.env.GARI_TOKEN_ADDRESS);
const SOLANA_API = process.env.SOLANA_API;
const connection = new web3.Connection(SOLANA_API, 'confirmed');
const chingariAccountsPublickey = new web3.PublicKey(
  process.env.AIRDROP_FEEPAYER_ASSOCIATED_ACCOUNT,
);
const AIRDROP_FEEPAYER_PRIVATE_KEY = new Uint8Array(
  process.env.AIRDROP_FEEPAYER_PRIVATE_KEY.split(',').map((e) => e * 1),
);
const chingariWallet = web3.Keypair.fromSecretKey(AIRDROP_FEEPAYER_PRIVATE_KEY);

export async function getAssociatedAccount(pubkey) {
  try {
    const publicKey = new web3.PublicKey(pubkey);
    const associatedAddress = await splToken.Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID, //this is in env
      programId,
      myMint, //gari
      publicKey, //owner
    );
    return associatedAddress;
  } catch (error) {
    throw error;
  }
}

export async function getAccountInfo(publicKey) {
  return connection.getParsedAccountInfo(new web3.PublicKey(publicKey));
}

export async function assocaiatedAccountTransaction(
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
      programId,
      chingariAccountsPublickey,
      associatedAddress,
      chingariWallet.publicKey,
      [],
      coins,
    ),
  );

  const transaction = new web3.Transaction({
    feePayer: new web3.PublicKey(process.env.AIRDROP_FEEPAYER_PUBLIC_KEY),
  }).add(...instructions);
  let blockhashObj = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhashObj.blockhash;

  transaction.sign(chingariWallet);
  let endocdeTransction = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  console.log('encodedTransaction', endocdeTransction);
  const signature = await connection.sendRawTransaction(endocdeTransction, {
    skipPreflight: false,
  });

  return signature;
}
