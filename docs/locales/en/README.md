# Formula Delta — English documentation

## Quick start

Requirements: Node.js 20.19+, pnpm 10, and Docker Desktop only when using Docker.

### Local development

Run these commands in two terminals from the repository root:

```powershell
pnpm.cmd --dir api dev
pnpm.cmd --dir client dev
```

Open `http://localhost:5173`.

### Docker

```powershell
docker compose up --build
```

Frontend: `http://localhost:5173`. Backend health: `http://localhost:3000/health`.

### Replay demo

```powershell
$env:FORMULA_DELTA_REPLAY_DIR = "$PWD\api\recordings\demo"
pnpm.cmd --dir api dev
```

To return to live mode, open a new terminal and run the backend without that variable.

### Validation

```powershell
pnpm.cmd verify
```
