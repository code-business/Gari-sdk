import { assocaiatedAccountTransaction, getAccountInfo, getAssociatedAccount } from "./helpers.js";

async function airdrop(publicKey, amount) {
    const userId = '62fe095e9dcd49be214cd819';
    publicKey = '9mCkTkYfHNJPZd8PSebgmG65qkxwdobyLrNyGE3qzUqq';
    amount = 1;
    const associatedAccount = await getAssociatedAccount(publicKey);
    const accountInfo = await getAccountInfo(
        associatedAccount.toString(),
    );
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
    console.log({ signature });
}

airdrop();