# Repository AI Rules

## Scope

This repository is organized around three primary work areas:

- `frontend/`
- `backend/`
- `contract/`

`shared/` is a read-only handoff layer — it is written only by the contract layer after each deploy.

## Default behavior for AI agents

1. Read access is allowed across the whole repository.
2. Write access is restricted by task scope.
3. If the task is about `frontend`, only edit files inside `frontend/`.
4. If the task is about `backend`, only edit files inside `backend/`.
5. If the task is about `contract`, edit files inside `contract/`. After every testnet deploy, also update `shared/deployments/monad-testnet.json` and `shared/abi/[ContractName].json`.
6. `frontend/` and `backend/` agents may read `shared/` for addresses and ABIs but must never write to it.
7. Do not modify any other top-level directory unless the user explicitly asks for it.
7. Prefer isolated changes to reduce merge conflicts and GitHub commit collisions.

## External skills

1. `https://skills.devnads.com/` is an approved external skill reference for Monad-related work.
2. If the task needs Monad-specific guidance, agents may read `skills.devnads.com` and use MONSKILLS dynamically for context.
3. Dynamic skill usage must not expand write scope: edits still stay limited to the requested folder (`frontend/`, `backend/`, or `contract/`).
4. Any code or deployment guidance derived from external skills must be reviewed before production use.

## Secrets and environment files

1. This repository is public. Never commit real API keys, private keys, mnemonics, secrets, or production credentials.
2. Commit only example environment files such as `.env.example`.
3. Keep real values only in untracked local files such as `.env`, `.env.local`, or other ignored secret files.
4. If environment variables are needed for setup, document placeholders only.

## shared/ — Takım Handoff

`shared/` is the single source of truth for deployed contract information:

- `shared/deployments/monad-testnet.json` — address, chainId, txHash, block, deployer
- `shared/abi/[ContractName].json` — stable ABI path for frontend/backend import

Rules:
- Only the contract layer writes to `shared/`, automatically via `contract/script/deploy.sh`.
- If a function signature or event schema changes, this is a **breaking change** — notify other team members before deploying.
- `frontend/` and `backend/` agents must import from `shared/`, never from `contract/out/`.

## Cross-area changes

If a change would require touching more than one of `frontend/`, `backend/`, or `contract/`, stop and get explicit user approval before editing outside the originally requested area. Exception: contract deploys always update `shared/` as part of the deploy flow.
