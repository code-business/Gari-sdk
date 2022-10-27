import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class loginDTO {
    @IsNotEmpty()
    @ApiProperty({
        required:true,
        description:'name needed',
        example:'abc'
    })
    name: string;

    @IsNotEmpty()
    @ApiProperty({
        required:true,
        description:'name needed',
        example:'abc'
    })
    id: string;
}