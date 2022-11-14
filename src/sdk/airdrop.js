import {
  assocaiatedAccountTransaction,
  getAccountInfo,
  getAssociatedAccount,
} from './helper.js';

async function airdrop(publicKey, amount) {
  try {
    //const userId = req.decoded._id;
    const userId = '62fe095e9dcd49be214cd819';
    publicKey = '9mCkTkYfHNJPZd8PSebgmG65qkxwdobyLrNyGE3qzUqq';
    amount = 1;
    const associatedAccount = await getAssociatedAccount(publicKey);
    const accountInfo = await getAccountInfo(associatedAccount.toString());
    let isAssociatedAccount = true;
    if (!accountInfo.value) {
      isAssociatedAccount = false;
    }
    const signature = await assocaiatedAccountTransaction(
      associatedAccount,
      publicKey,
      isAssociatedAccount,
      amount,
    );
    if (signature) {
      return {
        userid: userId,
        Signature: signature,
        status: 'draft',
        message: 'success',
      };
    }
  } catch (err) {
    return {
      code: 400,
      error: err.message,
      message: 'Error',
    };
  }
}

airdrop();
