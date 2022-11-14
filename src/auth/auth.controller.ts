import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import  * as fs from "fs"
import * as jose from "node-jose"

@Controller('auth')
export class AuthController {
  @Get(':id')
  async login(@Param('id') id:string) {
    try {
      if (!id) {
          throw new Error("Invalid Request")
      }
      const JWKeys = fs.readFileSync('keys.json');
      const keyStore = await jose.JWK.asKeyStore(JWKeys.toString());
      const [key] = keyStore.all({ use: 'sig' });
      const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } };
      const payload = JSON.stringify({
        iat: Math.floor(Date.now() / 1000),
        sub: "gari-sdk",
        uid: id,
      });
        const token = await jose.JWS.createSign(opt, key).update(payload).final();
      return token;
    } catch (error) {
      console.log('error', error);
    }
  }
}
