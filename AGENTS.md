# Repository AI Rules

## Scope

This repository is organized around three primary work areas:

- `frontend/`
- `backend/`
- `contract/`

## Default behavior for AI agents

1. Read access is allowed across the whole repository.
2. Write access is restricted by task scope.
3. If the task is about `frontend`, only edit files inside `frontend/`.
4. If the task is about `backend`, only edit files inside `backend/`.
5. If the task is about `contract`, only edit files inside `contract/`.
6. Do not modify any other top-level directory unless the user explicitly asks for it.
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

## Cross-area changes

If a change would require touching more than one of `frontend/`, `backend/`, or `contract/`, stop and get explicit user approval before editing outside the originally requested area.
