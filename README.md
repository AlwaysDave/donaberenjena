# Asociación Cultural Gastronómica "Doña Berenjena"

Plataforma integral para la gestión y promoción de catas enológicas, cursos formativos, viajes enoturísticos y reservas de la Asociación Cultural Gastronómica "Doña Berenjena".

---

## 🔒 Reglas de Seguridad de Firestore (`firestore.rules`)

El proyecto incluye el archivo `firestore.rules` que define el control de acceso basado en atributos y roles (ABAC):

- **`activities`**: Lectura pública (`allow read: if true;`) para que cualquier visitante pueda consultar las catas y eventos; creación, edición y borrado restringidos exclusivamente a administradores verificados en `admins/{uid}`.
- **`participants`**: Creación pública permitida únicamente para registrar reservas con validación de datos requeridos (`fullName`, `email`, `phone`, `spots`, `activityId`). **Lectura, modificación y borrado estrictamente restringidos a administradores autenticados**, garantizando la privacidad de los datos personales (PII) de los inscritos.
- **`admins`**: Lectura y modificación únicamente permitidas al propio usuario autenticado sobre su documento (`request.auth.uid == uid`), impidiendo la auto-concesión de privilegios a usuarios no autorizados.
- **`metrics`**: Lectura pública de métricas de ocupación y escritura restringida a administradores.

### Cómo desplegar las reglas a Firebase

Para desplegar las reglas de seguridad a tu proyecto de Firebase, ejecuta el siguiente comando en la terminal:

```bash
firebase deploy --only firestore:rules
```

---

## 🚀 Despliegue en Vercel

El backend serverless en `/api` procesa el análisis y extracción inteligente de carteles de catas en PDF o imagen mediante la API de Google Gemini. La configuración en `vercel.json` empaqueta automáticamente el prompt de sumiller experto (`api/prompts/analista_catas.md`) junto a las funciones serverless.
