var AWS = require('aws-sdk');
var fs = require('fs');

var ssm = new AWS.SSM({ region: process.env.AWS_REGION });

const main = async () => {
    try {
        const envs = [
            'SOLANA_API',
            'DB_PORT',
            'PORT',
            'DB_USERNAME',
            'DB_PASSWORD',
            'DB_DATABASE',
            'DB_HOST',
            'DB_HOST_RO',
            'PROGRAM_ID',
            'GARI_TOKEN_ADDRESS',
            'GARI_ASSOCIATED_ACCOUNT',
            'GARI_PUBLIC_KEY',
            'GARI_ASSOCIATED_TOKEN_PROGRAM_ID',
            'AIRDROP_FEEPAYER_PRIVATE_KEY',
            'AIRDROP_FEEPAYER_ASSOCIATED_ACCOUNT',
            'AIRDROP_FEEPAYER_PUBLIC_KEY',
            'GARI_PUBLIC_KEY'
        ];
        var writeStream = fs.createWriteStream('.env');

        console.log('ENVIRONMENT', process.env.ENVIRONMENT);

        await Promise.all(
            envs.map(async (elt) => {
                console.log(`/${process.env.ENVIRONMENT}/GARI_SDK_SERVICE/${elt}`);
                let data = await ssm
                    .getParameter({
                        Name: `/${process.env.ENVIRONMENT}/GARI_SDK_SERVICE/${elt}`,
                        WithDecryption: true,
                    })
                    .promise()
                    .catch((error) => console.log(error, elt));

                writeStream.write(`${elt}=${data.Parameter.Value}\n`);

                return data;
            }),
        );
        writeStream.end();
    } catch (error) {
        console.log(error);
    }
};
main();
