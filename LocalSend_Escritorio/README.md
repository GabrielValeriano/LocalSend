# LocalSend · Escritorio

Las instrucciones completas están en el [README principal](../README.md#1-app-de-escritorio-localsend_escritorio).

Resumen rápido:

```bash
bun install            # dependencias
bun run dev            # abrir en modo desarrollo
bun run build:linux    # instalador .AppImage en binarios/
bun run build:win      # instalador .exe (desde Windows)
```

Puertos: UDP 53317 (descubrimiento) y TCP 53318 (transferencia). Permitilos en el firewall.
