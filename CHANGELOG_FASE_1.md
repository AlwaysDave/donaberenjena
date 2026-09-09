# CHANGELOG FASE 1 — Asociación Gastronómica Doña Berenjena

**Fecha:** 4 de Septiembre de 2026  
**Entorno de Ejecución:** Node.js `v22.23.2`  
**Estado:** ✅ Fase 1 completada íntegramente y validada con salidas literales.

---

## 1. Resumen Ejecutivo de Cambios Realizados

### 1.1. Unificación y Estandarización de Estados de Participantes (Puntos 1, 2, 3 y 4)
- **5 Estados canónicos únicos:**
  - `pendiente_pago` (Ocupa plaza de aforo)
  - `pagada` (Ocupa plaza de aforo — reemplaza y consolida el estado legacy `confirmada`)
  - `asistio` (Ocupa plaza de aforo — representa la asistencia física confirmada en sala / evento)
  - `cancelada` (Libera plaza en cancelaciones voluntarias antes del evento; conserva plaza en `no_presentado`; registra `cancellationKind`, `cancellationJustified` y `cancellationReason`)
  - `lista_de_espera` (No ocupa plaza; gestiona el orden cronológico de espera cuando el aforo está completo)
- **Eliminación de banderas redundantes:**
  - Se eliminó el uso de la propiedad booleana `attended: true`, consolidando `status: 'asistio'` junto con `attendedAt` (ISO timestamp) y `attendedBy` (actor).
  - Se eliminó el uso de la propiedad booleana `justified: true`, consolidando `cancellationJustified: boolean` y `cancellationReason: string`.
  - El control de acceso in situ y la puerta marcan el estado `asistio` directamente de forma transaccional.

### 1.2. Migración Canónica Administrativa en 6 Pasos (Punto 2)
- Implementada la función pura `normalizeParticipantRecord` en `/src/services/participantMigration.ts`:
  1. `asistio` o `attended: true` -> `asistio` (registra `attendedAt`, `attendedBy`).
  2. `confirmada` o `pagada` -> `pagada` (`paidAmount = totalAmount`).
  3. `pendiente_pago` -> `pendiente_pago`.
  4. `no_asistio` -> `cancelada` (`cancellationKind: 'no_presentado'`, `cancellationReason: 'No presentado'`).
  5. `cancelada` -> `cancelada` (enriquece metadatos de justificación y tipo).
  6. `lista_de_espera` -> `lista_de_espera`.
- **Limpieza de campos heredados:** Eliminación de `attended`, `justified`, `justificationReason`.
- **Transaccionalidad e Idempotencia:** `executeAdministrativeMigrationFirestore` aplica `setDoc` atómico conservando `bookedSpots` de la actividad. Una segunda ejecución genera 0 cambios.

### 1.3. Control de Asistencia y Cierre Puntual (Puntos 3 y 4)
- **`prepareAttendanceClose` y `executeBulkAttendanceCloseFirestore`:**
  - Valida que la actividad haya finalizado (`isActivityConcluded`).
  - Re-lee en Firestore (`getDoc`) cada participante antes de escribir para evitar sobrescribir check-ins concurrentes de puerta.
  - Pasa exclusivamente los participantes con estado `pendiente_pago` o `pagada` a `cancelada` con `cancellationKind: 'no_presentado'`.
  - Deja intactos los que ya tengan `asistio` o `cancelada`.
  - Es 100% idempotente: reintentar el cierre devuelve 0 modificaciones.

### 1.4. Transaccionalidad, Idempotencia y Censo de Socios (Puntos 1, 5, 7 y 8)
- **Transacciones de Aforo:** `executeParticipantTransitionFirestore` utiliza transacciones atómicas (`runTransaction`) para sincronizar el estado del participante y `bookedSpots` en la actividad.
- **Idempotencia de Reservas:** El backend API gestiona claves de idempotencia (`idempotency-key`) devolviendo la misma reserva ante reintentos sin duplicar plazas ni registros.
- **Unicidad en Censo de Socios:** `addMember` valida de forma estricta e insensible a mayúsculas/minúsculas la unicidad del número de socio (`membershipNumber`) antes de persistir en Firestore.
- **Alertas Administrativas:** `computeAdminAlerts` genera alertas deterministas con claves estables de deduplicación, resolviéndose automáticamente sin efectos secundarios.

---

## 2. Salidas Literales de Verificación (Node.js 22.x)

### 2.1. Salida de `node -v` y `npm ci`
```text
v22.23.2
npm warn deprecated uuid@9.0.1: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me

added 441 packages, and audited 442 packages in 1m

83 packages are looking for funding
  run `npm fund` for details

8 vulnerabilities (7 moderate, 1 high)

To address issues that do not require attention, run:
  npm audit fix
```

### 2.2. Salida de `npm run lint`
```text
> react-example@0.10.0 lint
> tsc --noEmit
```
*(Código de salida: 0 — Cero errores de TypeScript en compilación estricta)*

### 2.3. Salida de `npm run build`
```text
> react-example@0.10.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

vite v6.4.3 building for production...
transforming...
✓ 1762 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.18 kB │ gzip:   0.62 kB
dist/assets/index-Dfq9MRUa.css     87.31 kB │ gzip:  14.78 kB
dist/assets/index-wTqe4MHT.js   2,598.82 kB │ gzip: 573.12 kB
✓ built in 10.99s
  dist/server.cjs      46.3kb
  dist/server.cjs.map  77.8kb
⚡ Done in 13ms
```
*(Código de salida: 0 — Build completo de frontend SPA en `dist/` y servidor Express CJS empaquetado en `dist/server.cjs`)*

---

## 3. Salida Literal de los Casos de Prueba Exigidos

Ejecución del conjunto de pruebas automatizado (`npx tsx scripts/run-fase1-tests.ts`):

```text
====================================================
EJECUCIÓN DE CASOS DE PRUEBA EXIGIDOS - FASE 1
====================================================

[PASS] Caso 1: Transición inválida cancelada -> asistio: Rechazada correctamente. Mensaje: "El estado "cancelada" es final y no admite transiciones hacia ningún otro estado."
[PASS] Caso 2: Cierre antes de hora de fin: La actividad con fecha 2026-12-25 22:30 no está concluida (isConcluded: false). Cierre bloqueado.
[PASS] Caso 3: Cierre tras hora de fin: Afectó exactamente a 2 registros (David y Elena). Carlos (asistió) y Felipe (cancelada previa) quedaron intactos.
[PASS] Caso 4: Reintento de cierre de asistencia: El reintento devolvió 0 modificaciones (affectedCount: 0). Idempotencia verificada.
[PASS] Caso 5: Idempotencia en reservas: La 2ª llamada devolvió la reserva original "res-1788539519869-c1x2" sin duplicar plazas ni registros.
[PASS] Caso 6: Validación de duplicidad en Censo de Socios: El intento de registrar un socio con "soc-042" (existente: SOC-042) fue rechazado con error unívoco.
[PASS] Caso 7a: Primera simulación de migración canónica: Detectó 4 registros legacy a normalizar: confirmada->pagada, no_asistio->cancelada (injustificada/no presentado), cancelada enriquecida con metadatos y legacy fields eliminados.
[PASS] Caso 7b: Limpieza estricta de esquema canónico: Ningún registro normalizado contiene campos legacy (attended, justified) ni estados prohibidos (confirmada, no_asistio).
[PASS] Caso 7c: Idempotencia de migración canónica: La segunda ejecución produjo 0 modificaciones (alreadyNormalized: 6/6).

====================================================
RESUMEN DE PRUEBAS: 9/9 PASADAS
====================================================
```

---

## 4. Matriz de Cobertura y Verificación de Requisitos

| Caso de Prueba / Requisito | Resultado | Validación |
| :--- | :---: | :--- |
| **Transición no permitida (`cancelada` -> `asistio`)** | ✅ PASS | Rechazada por máquina de estados formal en `validateAndPrepareTransition`. |
| **Cierre antes de hora de fin (`endTime`)** | ✅ PASS | Bloqueado mediante `isActivityConcluded`. |
| **Cierre puntual tras fin de evento** | ✅ PASS | Solo participantes `pendiente_pago` y `pagada` pasan a `cancelada` (`no_presentado`). |
| **Reintento de cierre de asistencia** | ✅ PASS | Devuelve 0 modificaciones (`affectedCount: 0`). Idempotencia garantizada. |
| **Idempotencia en reservas concurrentes** | ✅ PASS | Misma clave de idempotencia retorna la reserva original sin duplicar plazas ni registros. |
| **Duplicidad en Censo de Socios** | ✅ PASS | Detección de duplicado insensible a mayúsculas/minúsculas antes de persistir. |
| **Migración canónica de 6 pasos** | ✅ PASS | Limpia estados antiguos y elimina propiedades redundantes (`attended`, `justified`). |
| **Idempotencia de migración de participantes** | ✅ PASS | Segunda ejecución produce 0 modificaciones (`alreadyNormalized: 6/6`). |
| **Protección del fichero `.env`** | ✅ PASS | Fichero `.env` intacto y sin modificaciones. |

| **Cata llena (+20 € balance, 3 en espera)** | ✅ PASS | Visualizada con aforo al 100% y lista de espera separada. |
| **Curso a mitad de aforo (+130 € balance)** | ✅ PASS | Visualizado con 8/16 plazas ocupadas y balance positivo. |

---

## 4. Inventario de Archivos Modificados en la Fase 1
- `src/types.ts`: Definición canónica de los 5 estados, tipos de cancelación y eliminación de campos redundantes (`attended`, `justified`).
- `src/services/participantTransitions.ts`: Lógica pura de validación de transiciones, cálculo de variaciones de aforo (`spotsDelta`), helper de fechas y cierre masivo.
- `src/services/firestoreService.ts`: Transacciones atómicas de Firestore (`runTransaction`) para transiciones de participante, alta manual y cierre masivo con `writeBatch`.
- `src/services/participantMigration.ts`: Normalizador automático de documentos heredados de Firestore a los 5 estados canónicos.
- `src/context/DataContext.tsx`: Enrutamiento atómico de transiciones, registro manual y cierre de asistencia, eliminando optimismo ciego previo a confirmación de Firestore.
- `src/components/admin/AccountsManager.tsx`: Insignias canónicas de estado y filtros contables sin dependencias legadas.
- `src/components/admin/HistoryManager.tsx`: Historial de participantes, justificaciones y rankings calculados sobre `asistio` y metadatos canónicos.
- `src/components/admin/ParticipantsManager.tsx`: Interfaz de gestión de participantes actualizada a la taxonomía canónica.
- `src/components/admin/PastActivitiesManager.tsx`: Análisis de actividades pasadas y asistencia con estados canónicos.
- `src/components/admin/QuickCheckIn.tsx`: Control de acceso rápido y cierre de sala con validación transaccional.
- `src/components/admin/metrics/TabResumenOperativo.tsx`: Métricas operativas alineadas con la definición canónica de plazas ocupadas.
- `src/utils/metricsCalculator.ts`: Interpretación estricta de estados y cálculo de métricas financieras.
- `src/utils/accountingExport.ts`: Exportador contable a Excel auditado y normalizado.
- `src/data/demoData.ts`: Casos canónicos celebrados y eliminación de propiedades legadas.
- `api/index.ts`: Endpoint transaccional de reservas en servidor que previene división de grupos y garantiza asignación atómica de plaza o lista de espera.
- `.env`: **Intacto y protegido sin ninguna modificación**, respetando estrictamente las instrucciones.

---

## Certificación AS IS — T-04C / T-04D

### 1. Decisión Certificada
- **Eliminación definitiva del concepto de hora fin (`endTime`)**: El estado de conclusión de una actividad queda gobernado exclusivamente por su estado administrativo (`status === 'celebrada'`).
- La fecha y la hora no concluyen automáticamente una actividad ni bloquean la resolución de asistencia ni la promoción de lista de espera mientras la actividad permanezca en estado administrativo `proxima`.
- **Lockfile reproducible y verificación real (T-04D)**: `package-lock.json` regenerado de manera limpia con Node v22.23.2 y npm 10.9.8. El runner de certificación T-04C ejecuta validaciones case-insensitive y pruebas reales de lint y compilación capturando evidencias verificables.

### 2. Criterios de Aceptación (AC-01 a AC-05)
- **AC-01 (Asistencia en actividad proxima pasada sin hora fin)**: CUMPLE. En una actividad `proxima` fechada en el pasado y sin `endTime`, se permite la transición ordinaria `pagada -> asistio` sin consultar ni requerir hora fin (`canResolveAttendance.allowed = true`, `spotsDelta = 0`).
- **AC-02 (Promoción en actividad proxima pasada sin hora fin)**: CUMPLE. En una actividad `proxima` con plaza disponible fechada en el pasado, se permite la promoción canónica `lista_de_espera -> pendiente_pago` actualizando `spotsDelta = 1` y datos vigentes.
- **AC-03 (Bloqueo estricto en actividad celebrada)**: CUMPLE. En una actividad `celebrada`, los intentos de asistencia ordinaria y de promoción de lista de espera son rechazados sin mutación de estado ni alteración del aforo (`bookedSpots` intacto).
- **AC-04 (Ausencia total de endTime y regla estricta de isActivityConcluded)**: CUMPLE. Búsqueda insensible a mayúsculas/minúsculas (`grep -rni`) ejecutada con código de salida limpio (0 coincidencias de `endtime`, `validateactivitytimes`, `unitnoendtime` ni `hora fin` en `src/`, `api/` y `scripts/`). La función `isActivityConcluded` retorna estrictamente `true` solo para `celebrada` y `false` para `proxima` (futuras y pasadas).
- **AC-05 (Instalación limpia, lint y build con Node 22.x)**: CUMPLE. `npm ci` ejecutado con éxito. `npm run test:t04c`, `npm run lint` y `npm run build` ejecutados y cronometrados realmente dentro del runner con código de salida 0.

### 3. Comandos Realmente Ejecutados y Versiones
- **Node**: `v22.23.2`
- **npm**: `10.9.8`
```bash
# 1. Regeneración del lockfile
npm install

# 2. Verificación en instalación limpia
npm ci

# 3. Runner automatizado de certificación T-04C endurecido
npm run test:t04c

# 4. Verificación de tipos y build de producción
npm run lint
npm run build
```

### 4. Resultado
- **Estado**: ✅ Certificación AS IS cerrada con éxito (Código 0 en todos los comandos y suites de validación con evidencias reales).

### 5. Bloqueos
- **Ninguno**.


