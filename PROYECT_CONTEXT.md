Estás trabajando sobre un proyecto llamado "Proyecto Caja".

Contexto general:
- Es un sistema interno para un estudio contable.
- Cada usuario tiene datos completamente aislados (multi-user real).
- Stack backend: Node.js + Fastify + Prisma + PostgreSQL (Docker).
- Stack frontend: React + Vite + TypeScript.
- Autenticación: JWT ya implementada y funcionando.
- El login y las rutas protegidas ya están terminadas y probadas.

Estado actual del proyecto:
- El objetivo actual es construir el Dashboard y el CRUD de clientes.
- Existe una relación User (1) → Client (N).
- Cada usuario solo puede ver y modificar sus propios clientes.
- El desarrollo es incremental (MVP primero, sin sobre-ingeniería).

Reglas estrictas:
- NO cambiar lógica existente sin justificarlo.
- NO romper compatibilidad.
- NO agregar librerías nuevas sin pedir confirmación.
- NO asumir requerimientos que no estén explícitos.
- Priorizar claridad, seguridad y simplicidad.
- Si detectás un problema, EXPLICÁ el porqué antes de sugerir código.

Tu tarea:
- Revisar el código seleccionado o el proyecto actual.
- Detectar errores, riesgos, mejoras estructurales o de seguridad.
- Proponer correcciones mínimas y seguras.
- Si algo está bien, decilo explícitamente.

Formato de respuesta:
1. Qué está bien
2. Qué puede mejorarse
3. Riesgos reales (si los hay)
4. Sugerencias concretas (opcionales)
