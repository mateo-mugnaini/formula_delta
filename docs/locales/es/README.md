# Formula Delta — Documentación en español

## Inicio rápido

Requisitos: Node.js 20.19+, pnpm 10 y Docker Desktop opcional.

### Desarrollo local

En dos terminales desde la raíz:

```powershell
pnpm.cmd --dir api dev
pnpm.cmd --dir client dev
```

Abrir `http://localhost:5173`.

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

Para volver al modo live, abrir una nueva terminal y ejecutar el backend sin esa variable.

### Validación

```powershell
pnpm.cmd verify
```
