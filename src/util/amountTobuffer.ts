const BN = require('bn.js');

import * as BufferLayout from 'buffer-layout';
// import * as Layout from '../layout';
// import { uint64 } from './layout.js';

export const amountFromBuffer = (amountBuffer) => {
    const dataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        uint64('amount'),
    ]);

    let temp = dataLayout.decode(amountBuffer);
    let decodedAmount = [...temp.amount]
        .reverse()
        .map((i) => `00${i.toString(16)}`.slice(-2))
        .join('');

    let AmountInBigNumber = new BN(decodedAmount, 16);

    return parseInt(AmountInBigNumber.toString());
};

export const uint64 = (property= 'uint64')=> {
    return BufferLayout.blob(8, property);
  };