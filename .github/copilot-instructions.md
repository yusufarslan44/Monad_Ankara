# GitHub Copilot Instructions

This repository uses strict folder ownership to reduce commit conflicts.

## Main folders

- `frontend/`
- `backend/`
- `contract/`

## Rules

1. You may read any file in the repository for context.
2. You may only modify files inside the target folder requested by the user.
3. Do not edit files outside `frontend/`, `backend/`, or `contract/` unless the user explicitly asks for a repo-wide change.
4. Do not move files between main folders unless explicitly requested.
5. Keep changes scoped and minimal to avoid merge and GitHub history conflicts.
6. `https://skills.devnads.com/` is an approved Monad skill source for dynamic reference when Monad-specific implementation details are needed.
7. Using external skills does not grant permission to edit outside the requested folder.
8. Treat code generated from external AI skill guidance as draft quality until reviewed and audited.
9. This is a public repository. Never commit real secrets, API keys, mnemonics, or private credentials.
10. Only commit template environment files such as `.env.example`; keep real values in ignored local env files.

## Folder targeting

- Frontend tasks: edit only `frontend/`
- Backend tasks: edit only `backend/`
- Contract tasks: edit only `contract/`
