import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import * as fs from "fs";
import * as jose from "node-jose";
import * as jwkToPem from 'jwk-to-pem';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<any> {
        try {
            
            const request = context.switchToHttp().getRequest();
            const { authorization } = request.headers;

            if (!authorization || authorization.trim() === '') {
                throw new UnauthorizedException('Please provide token');
            }

            const authorizationString = authorization.replace(/bearer/gim, '').trim();

            let decodedToken = jwt.decode(authorizationString, { complete: true });

            let kid = decodedToken.header.kid;

            const JWKeys = fs.readFileSync('keys.json');
            const keyStore = await jose.JWK.asKeyStore(JWKeys.toString());
            
            
            const [key] = keyStore.all({ use: 'sig' });
            
            const decoded = jwt.verify(authorizationString, key.kid);

            console.log(key);
            
            // request.decoded = decoded;
            return true;
        } catch (error) {
            console.log("failed");
            
        }

    }

    // app.post("/verify", async (req, res) => {
    //     let resourcePath = "token/jwks";
      
    //     let token = req.body;
      
    //     let decodedToken = jwt.decode(token, { complete: true });
      
    //     let kid = decodedToken.headers.kid;
      
    //     return new Promise(function (resolve, reject) {
    //       var jwksPromise = config.request("GET", resourcePath);
      
    //       jwksPromise
    //         .then(function (jwksResponse) {
    //           const jwktopem = require("jwk-to-pem");
      
    //           const jwt = require("jsonwebtoken");
      
    //           const [firstKey] = jwksResponse.keys(kid);
    //           const publicKey = jwktopem(firstKey);
    //           try {
    //             const decoded = jwt.verify(token, publicKey);
    //             resolve(decoded);
    //           } catch (e) {
    //             reject(e);
    //           }
    //         })
    //         .catch(function (error) {
    //           reject(error);
    //         });
    //     });
    //   });


}