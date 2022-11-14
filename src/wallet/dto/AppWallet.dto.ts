import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
export class RegisterAppWalletDto {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Encrepted private key of user',
    example: '',
  })
  appName: String;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'public key of user',
    example: '',
  })
  publicKey: String;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Backup encrepted private key of user',
    example: '',
  })
  packageName: String;
}

export class SendAirdrop {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'Encrepted private key of user',
    example: '',
  })
  publicKey: String;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'public key of user',
    example: '',
  })
  amount: string;
}

export class EncodedTransactionDTO {
  @ApiProperty({
    description: 'Reciever public key',
    example: 'G7KfeteDuz4QgAFEpAXgng3zptkL4G8vzmqdNsBrexAK',
    required: false,
  })
  publicKey: String;

  @ApiProperty({
    description: 'amount',
    example: '100000',
    required: false,
  })
  amount: number;
}
export class BuyAppDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'encoded transactions',
    example:
      'EJ3FktdZhsNbDMamvSygi2wLfjBgisWzF1iNecdckQVmsdgEJ3FktdZhsNbDMamvSygi2wLfjBgisWzF1iNecdckQVm',
    required: true,
  })
  encodedTransaction: String;
}
export class ConnectAppWalletDto {
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'appName of user',
    example: '',
  })
  appName: String;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'clientId of user',
    example: '',
  })
  clientId: string;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'public key of user',
    example: '',
  })
  publicKey: String;

  @IsNotEmpty()
  @ApiProperty({
    required: true,
    description: 'userId',
    example: '',
  })
  userId: string;

  // @IsNotEmpty()
  // @ApiProperty({
  //   required: true,
  //   example: '',
  // })
  // encryptedPrivateKey: String;
}
export class GetWalletDetailsDto {
  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
  token: String;
}

export class GetRecWalletDetailsDto {
  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
  publicKey: String;
}

export class SaveTransactionData {

  @ApiProperty({
    example:
      '',
    required: true,
  })
  fromUserId: string;
  
  @ApiProperty({
    example:
      '',
    required: true,
  })
  toUserId: string;
  
  @ApiProperty({
    example:
      '',
    required: true,
  })
  status: string;

  @ApiProperty({
    example:
      '',
    required: true,
  })
  case: string;

  @ApiProperty({
    example:
      '',
    required: true,
  })
  fromPublicKey: string;

  @ApiProperty({
    example:
      '',
    required: true,
  })
  toPublicKey: string;
  
  @ApiProperty({
    example:
      '',
    required: true,
  })
  signature: string;
}

export class UpdateTransaction {
  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
  signature: String;
}

export class deleteAndUpdateWalletData {
  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
  pendingTransactionId: String;

  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
walletId: String;

  @IsNotEmpty()
  @ApiProperty({
    example:
      '',
    required: true,
  })
coinsToAdd: String;
}

