require('dotenv/config'); // load everything from `.env` file into the `process.env` variable

const {
    DB_PORT,
    DB_LOCAL_HOST,
    DB_LOCAL_USERNAME,
    DB_LOCAL_PASSWORD,
    DB_LOCAL_DATABASE,
} = process.env;

module.exports = [
    {
        name: 'default',
        type: 'postgres',
        host: DB_LOCAL_HOST,
        port: DB_PORT,
        username: DB_LOCAL_USERNAME,
        password: DB_LOCAL_PASSWORD,
        database: DB_LOCAL_DATABASE,
        synchronize: true,
        entities: ['src/**/*.entity.ts'],
        subscribers: ['src/**.module/*-subscriber.ts'],
        migrations: ['src/migration/**/*.ts'],
        cli: {
            migrationsDir: 'src/migration',
        },
    },
];
