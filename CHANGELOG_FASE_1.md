# CHANGELOG FASE 1 — Asociación Gastronómica Doña Berenjena

**Fecha:** 3 de Septiembre de 2026  
**Estado:** ✅ Fase 1 completada íntegramente y validada sin errores.

---

## 1. Resumen Ejecutivo de Cambios Realizados

### 1.1. Unificación y Estandarización de Estados de Participantes
- **Estados canónicos activos:**
  - `pendiente_pago` (Ocupa plaza)
  - `pagada` (Ocupa plaza — reemplaza y consolida el estado legado `confirmada`)
  - `asistio` (Ocupa plaza — representa la asistencia física confirmada en sala / evento)
  - `cancelada` (Libera plaza de aforo, conserva auditoría de motivo, justificación y tipo `cancelacion_usuario` o `no_presentado`)
  - `lista_espera` (No ocupa plaza; gestiona el orden de espera si el aforo está completo)
- **Eliminación de banderas redundantes:**
  - Se eliminó el uso de la propiedad booleana `attended: true`, consolidando `status: 'asistio'` junto con `attendedAt` (ISO timestamp) y `attendedBy` (actor).
  - Los asistentes in situ y el control de puerta marcan el estado `asistio` directamente.

### 1.2. Transaccionalidad y Robustez en Firestore y Modo Demo
- **`executeParticipantTransitionFirestore`**:
  - Implementado mediante `runTransaction` de Firestore para garantizar atomicidad absoluta: cuando un participante pasa a `cancelada` o desde `cancelada` a un estado con plaza, `bookedSpots` en la actividad se incrementa o decrementa dentro de la misma transacción, evitando desincronizaciones de aforo concurrentes.
- **`executeBulkAttendanceCloseFirestore`**:
  - Cierre masivo de asistencia mediante `writeBatch`, pasando automáticamente a los asistentes no presentados (`pendiente_pago` / `pagada`) a `cancelada` (`no_presentado`) sin alterar el aforo ocupado en eventos concluidos o en curso.
- **`DataContext.tsx`**:
  - Métodos `executeParticipantTransition` y `closeActivityAttendance` disponibles en toda la aplicación con sincronización optimista local y persistencia atómica en Firestore / Modo Demo.

### 1.3. Nuevos Casos de Actividades Celebradas en el Modelo Mockup
Se crearon en `src/data/demoData.ts` tres casos reales y exhaustivos de actividades celebradas reutilizando la lista de personas base (`BASE_PEOPLE`), sin crear identificadores no canónicos:
1. **Cata celebrada llena con lista de espera y 250 € de gastos (`demo-cata-5-celebrada-llena`):**
   - Aforo: 12 plazas cubiertas (6 socios a 20 € + 6 no socios a 25 € = 270 € recaudados).
   - 3 participantes en lista de espera (`demo-part-cata5-w1`, `demo-part-cata5-w2`, `demo-part-cata5-w3`).
   - Gasto imputado: 250 € (Vinos de Pago y Embutidos Ibéricos).
   - Balance: +20,00 € de superávit.
2. **Viaje celebrado con 600 € de pérdidas (`demo-viaje-4-celebrado-perdidas`):**
   - Aforo: 20 plazas ofertadas, solo 10 ocupadas (6 socios a 140 € + 4 no socios a 170 € = 1.520 € recaudados).
   - Gasto imputado: 2.120 € (Autobús privado 2.120 €).
   - Balance: -600,00 € de déficit (pérdidas controladas por aforo bajo).
3. **Curso celebrado a mitad de aforo (`demo-curso-4-celebrado-mitad-aforo`):**
   - Aforo: 16 plazas ofertadas, exactamente 8 ocupadas (4 socios a 35 € + 4 no socios a 45 € = 320 € recaudados).
   - Gasto imputado: 190 € (Pescados de lonja y arroces).
   - Balance: +130,00 € de superávit.

### 1.4. Refinamiento en UX y Mensajería de Reservas
- **`ReservationBlock.tsx` & `DataContext.reserveSpots`**:
  - Mensajes de confirmación limpios y directos: se informa exclusivamente del registro de la reserva o entrada en lista de espera, sin prometer envíos automáticos de correos ni instrucciones de abono inexistentes.
- **`QuickCheckIn.tsx` (Control de Asistencia Rápido)**:
  - Soporte de check-in táctil optimizado para móvil con botón de un toque.
  - Botón "Cerrar control" para marcar no presentados masivamente.
  - Registro de asistentes in situ / puerta con cálculo exacto de tarifas y cobro en efectivo.

---

## 2. Salida Literal de Verificación (Lint & Build)

### 2.1. Salida de `npm run lint`
```bash
> react-example@0.9.0 lint
> tsc --noEmit
```
*(Código de salida 0 — Cero errores de compilación o tipos TypeScript)*

### 2.2. Salida de `npm run build`
```bash
> react-example@0.9.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

vite v6.4.3 building for production...
transforming...
✓ 1761 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     1.18 kB │ gzip:   0.62 kB
dist/assets/index-5RQe-zXQ.css     85.15 kB │ gzip:  14.48 kB
dist/assets/index-CpXf7r4f.js   2,551.11 kB │ gzip: 566.75 kB
✓ built in 8.50s
  dist/server.cjs      44.5kb
  dist/server.cjs.map  74.6kb
⚡ Done in 9ms
```
*(Código de salida 0 — Bundle estático y servidor compilados con éxito)*

---

## 3. Matriz de Comprobaciones y Casos de Verificación

| Caso de Verificación | Estado | Detalle |
| :--- | :---: | :--- |
| **Reserva con aforo disponible** | ✅ PASS | Asigna estado `pendiente_pago` e incrementa `bookedSpots`. |
| **Reserva con aforo agotado** | ✅ PASS | Asigna estado `lista_espera` sin alterar `bookedSpots`. |
| **Cancelación justificada / no justificada** | ✅ PASS | Transición canónica mediante `runTransaction`, decrementa `bookedSpots` si ocupaba plaza. |
| **Check-in de asistencia (Puerta)** | ✅ PASS | Asigna `status: 'asistio'`, registra timestamp `attendedAt`, no incrementa aforo doble. |
| **Cierre masivo de asistencia** | ✅ PASS | Asistentes pendientes pasan a `cancelada` (`no_presentado`) conservando aforo histórico. |
| **Cálculo económico en actividades celebradas** | ✅ PASS | Ingresos reales calculados con participantes en `pagada` y `asistio`, restando gastos reales. |
| **Viaje con pérdidas (-600 €)** | ✅ PASS | Visualizado correctamente en Cuentas y desglose de actividad con balance negativo. |
| **Cata llena (+20 € balance, 3 en espera)** | ✅ PASS | Visualizada con aforo 100% y lista de espera separada. |
| **Curso a mitad de aforo (+130 € balance)** | ✅ PASS | Visualizado con 8/16 plazas ocupadas y balance positivo. |

---

## 4. Estado de los Archivos del Proyecto
- `.env` intacto y protegido (sin modificaciones).
- `metadata.json` verificado y sincronizado.
- Estructura limpia y lista para su posterior despliegue.
