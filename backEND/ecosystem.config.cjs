module.exports = {
    apps: [
        {
            name: 'antrian-igd-backend',
            cwd: __dirname,
            script: 'server.js',
            exec_mode: 'fork',
            instances: 1,
            watch: false,
            autorestart: true,
            max_memory_restart: '300M',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
