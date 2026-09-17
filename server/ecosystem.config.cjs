module.exports = {
    apps: [
        {
            name: 'pvzgw2d-server',
            script: 'npx',
            args: 'tsx src/index.ts',
            cwd: __dirname,
            max_memory_restart: '250M',
            env: {
                PORT: 3001,
                HOST: '127.0.0.1',
                // Update this if your client ends up on the apex domain
                // instead of *.vercel.app — see the note below.
                CLIENT_ORIGIN: 'https://pvzgw2d.com.br',
            },
        },
    ],
};