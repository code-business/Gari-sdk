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