// server/ecosystem.config.cjs
// Environment-specific values (PORT/HOST/CLIENT_ORIGIN) live in server/.env,
// which is gitignored and excluded from the deploy workflow's rsync — this
// file is deliberately identical everywhere and safe for CI to overwrite on
// every push. Edit server/.env on the box, never this file, for config.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

module.exports = {
    apps: [
        {
            name: 'pvzgw2d-server',
            script: 'npx',
            args: 'tsx src/index.ts',
            cwd: __dirname,
            max_memory_restart: '250M',
            env: {
                PORT: process.env.PORT,
                HOST: process.env.HOST,
                CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
            },
        },
    ],
};
