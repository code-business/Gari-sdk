import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { loginDTO } from './dto/login.dto';
import  * as fs from "fs"
import * as jose from "node-jose"

@Controller('auth')
export class AuthController {
  @Get()
  async login(@Query('name') name?: string, @Query('id') id?: string) {
    try {
      // if (!name || !id) {
      //     throw new Error("Invalid Request")
      // }

      const JWKeys = fs.readFileSync('keys.json');

      console.log(JWKeys);

      const keyStore = await jose.JWK.asKeyStore(JWKeys.toString());
      // console.log('keyStore', keyStore)
      const [key] = keyStore.all({ use: 'sig' });

      const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } };

      const payload = JSON.stringify({
        exp: '1d',
        sub: 'dummy-app',
        name,
        uid: id,
        iat: Math.floor(Date.now() / 1000),
      });

        const token = await jose.JWS.createSign(opt, key).update(payload).final();
        
      return token;
    } catch (error) {
      console.log('error', error);
    }
  }
}
