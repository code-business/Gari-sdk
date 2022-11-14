
async function getTransactionsById(transactionId)
{
    try
    {
        // step 1 
        // get userId from request body
        // and find if any transaction data exists
        const userId = "6297b336bcc7450014680daa";

        let transactionData = await walletService.fetchTransactionData({
            id : transactionId,
            userId
        });

        
        
        if(!transactionData) 
        {
            // transaction not found
            throw new Error;
        }
        






    }
    catch(err)
    {
        console.log("error in getTransactionsById function ", err);
    }
}

getTransactionsById();