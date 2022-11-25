import { config } from 'dotenv';
config();
const constantsInfo = {
  DB_LOCAL_USERNAME: process.env.DB_LOCAL_USERNAME,
  DB_LOCAL_PASSWORD: process.env.DB_LOCAL_PASSWORD,
  DB_LOCAL_DATABASE: process.env.DB_LOCAL_DATABASE,
  DB_LOCAL_HOST: process.env.DB_LOCAL_HOST,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  PORT: process.env.PORT,
};

// (function () {
//   Object.entries(constantsInfo).forEach((ent: any) => {
//     if (!ent[1] || (ent[1] && ent[1].toString().trim() === ''))
//       throw new Error('Please provide proper env variables');
//   });
// })();
export default constantsInfo;
