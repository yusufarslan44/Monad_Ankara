const path = require('node:path');

const rootDir = __dirname;
const frontendHost = process.env.FRONTEND_HOST || '0.0.0.0';
const frontendPort = process.env.FRONTEND_PORT || '3022';

module.exports = {
  apps: [
    {
      name: 'monad-ankara-backend',
      cwd: path.join(rootDir, 'backend'),
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'monad-ankara-frontend',
      cwd: path.join(rootDir, 'frontend'),
      script: 'npm',
      args: `run preview -- --host ${frontendHost} --port ${frontendPort}`,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
