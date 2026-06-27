# Contract AI Rules

## Editable scope

AI agents may edit files in this directory when the task is a contract or smart-contract task.

## Restrictions

1. Do not edit `../frontend/`.
2. Do not edit `../backend/`.
3. Other repository folders may be read for context, but they are read-only unless the user explicitly approves broader changes.
4. Keep contract commits isolated to reduce merge conflicts.
5. For Monad contract work, `https://skills.devnads.com/` may be used as a dynamic skill reference, but only `contract/` remains editable.
6. Never commit real contract secrets, private keys, or deployment credentials; only commit example env/config files with placeholder values.
