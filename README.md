# Asociación Cultural Gastronómica "Doña Berenjena"

Plataforma integral para la gestión y promoción de catas enológicas, cursos formativos, viajes enoturísticos y reservas de la Asociación Cultural Gastronómica "Doña Berenjena".

---

## 🔒 Reglas de Seguridad de Firestore (`firestore.rules`)

El proyecto incluye el archivo `firestore.rules` que define el control de acceso basado en atributos y roles (ABAC):

- **`activities`**: Lectura pública (`allow read: if true;`) para que cualquier visitante pueda consultar las catas y eventos; creación, edición y borrado restringidos exclusivamente a administradores verificados en `admins/{uid}`.
- **`participants`**: Todas las operaciones de lectura, escritura y borrado están estrictamente restringidas a administradores autenticados. La creación pública está desactivada en el cliente; cualquier visitante debe reservar mediante la transacción atómica backend `/api/reserve`, garantizando la integridad del aforo y la privacidad de los datos personales (PII) de los inscritos.
- **`admins`**: Lectura y modificación únicamente permitidas al propio usuario autenticado sobre su documento (`request.auth.uid == uid`), impidiendo la auto-concesión de privilegios a usuarios no autorizados.
- **`metrics`**: Lectura pública de métricas de ocupación y escritura restringida a administradores.

### ⚙️ Configuración del Servidor y Firebase Admin

Para el correcto funcionamiento de las reservas transaccionales y validación segura del rol de administrador en operaciones de Inteligencia Artificial (Gemini), se requiere configuración **server-side**:

1. El entorno de servidor debe inicializar Firebase Admin (Cuenta de Servicio).
2. Configura manualmente la variable `FIREBASE_SERVICE_ACCOUNT_KEY` en tu proveedor de despliegue, incluyendo un JSON serializado (en una sola línea) de las credenciales. **Nunca subas, comprometas o dejes en el código público este archivo JSON.**
3. En entornos de desarrollo local, se puede usar `ALLOW_DEV_AUTH_BYPASS=true` para deshabilitar temporalmente esta validación de administradores usando tokens prefijados con `dev-session-`. **Nunca actives esto en producción.**

### Cómo desplegar las reglas a Firebase

Para desplegar las reglas de seguridad a tu proyecto de Firebase, ejecuta el siguiente comando en la terminal:

```bash
firebase deploy --only firestore:rules
```

---

## 🚀 Despliegue en Vercel

El backend serverless en `/api` procesa el análisis y extracción inteligente de carteles de catas en PDF o imagen mediante la API de Google Gemini. La configuración en `vercel.json` empaqueta automáticamente el prompt de sumiller experto (`api/prompts/analista_catas.md`) junto a las funciones serverless.
