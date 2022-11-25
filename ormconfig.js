require('dotenv/config'); // load everything from `.env` file into the `process.env` variable

const {
    DB_PORT,
    DB_LOCAL_HOST,
    DB_LOCAL_USERNAME,
    DB_LOCAL_PASSWORD,
    DB_LOCAL_DATABASE,
    DB_USERNAME,
    DB_PASSWORD,
    DB_DATABASE,
    DB_HOST,
} = process.env;

module.exports = [
    {
        name: 'default',
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        synchronize: false,
        entities: ['src/**/*.entity.ts'],
        subscribers: ['src/**.module/*-subscriber.ts'],
        migrations: ['src/migration/**/*.ts'],
        cli: {
            migrationsDir: 'src/migration',
        },
    },
];
