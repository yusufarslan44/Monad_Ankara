# Production Deploy

This repository includes two GitHub Actions workflows:

- `.github/workflows/ci.yml`
  Runs backend tests and frontend typecheck/test/build on push, pull request, and manual dispatch.
- `.github/workflows/deploy-production.yml`
  Deploys to the production server after `CI` succeeds on `main`, or manually via `workflow_dispatch`.

## Required GitHub secrets

Add these in `Settings > Secrets and variables > Actions`:

- `PRODUCTION_HOST` — production server host or IP
- `PRODUCTION_USER` — SSH user
- `PRODUCTION_SSH_KEY` — private SSH key for the deploy user
- `PRODUCTION_PORT` — SSH port, usually `22`

## Optional GitHub variables

Add this in `Settings > Secrets and variables > Actions > Variables`:

- `PRODUCTION_APP_DIR` — defaults to `/home/yusuf/projects/Monad_Ankara`

## First-time server requirements

The server must already have:

- the repo cloned at the production app directory
- `backend/.env` present
- `frontend/.env` present
- Node.js and npm installed
- PM2 installed
- `ecosystem.config.cjs` present in the repo root

## Manual deploy

After secrets are configured, you can run:

- `Actions > Deploy Production > Run workflow`

The workflow SSHes into the server, pulls the target ref, installs dependencies, builds the frontend, and reloads PM2.

## Safety model

The deploy uses `git pull --ff-only` on the server. If the server repo has tracked local changes, the deploy will fail instead of overwriting them.
