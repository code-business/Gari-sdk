import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Min, Max, IsInt } from 'class-validator';

export class GetTransctionByUser {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    description: 'page',
    required: true,
    type: 'number',
    default: 1,
    example: 1,
  })
  readonly page: number;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsNotEmpty()
  @ApiProperty({
    description: 'limit',
    required: true,
    type: 'number',
    example: 10,
  })
  readonly limit: number;

  @IsNotEmpty()
  @ApiProperty({
    description: 'sorting',
    required: true,
    type: 'string',
    default: 'DESC',
    example: 'DESC',
  })
  sorting: string;

  // @IsOptional()
  @ApiProperty({
    description: 'filter based on user id',
    required: false,
    example: { fromUserId: '' },
    default: {},
  })
  filter: any;
}