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

  // @IsNotEmpty()
  // @ApiProperty({
  //   required: true,
  //   description: 'clientId of ludo',
  //   example: '',
  // })
  // clientId: String;
}
