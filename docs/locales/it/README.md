# Formula Delta — Documentazione in italiano

## Avvio rapido

Requisiti: Node.js 20.19+, pnpm 10 e Docker Desktop solo per l'esecuzione con Docker.

### Sviluppo locale

Eseguire questi comandi in due terminali dalla radice del repository:

```powershell
pnpm.cmd --dir api dev
pnpm.cmd --dir client dev
```

Aprire `http://localhost:5173`.

### Docker

```powershell
docker compose up --build
```

Frontend: `http://localhost:5173`. Health del backend: `http://localhost:3000/health`.

### Replay demo

```powershell
$env:FORMULA_DELTA_REPLAY_DIR = "$PWD\api\recordings\demo"
pnpm.cmd --dir api dev
```

Per tornare alla modalità live, aprire un nuovo terminale ed eseguire il backend senza la variabile.

### Validazione

```powershell
pnpm.cmd verify
```
