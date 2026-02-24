# ⏰ clockInTime - Gestión de Equipos Simplificada

**clockInTime** es una plataforma web integral diseñada para la gestión eficiente de recursos humanos. Permite a las empresas controlar fichajes, gestionar ausencias, organizar tareas y administrar perfiles de empleados desde una interfaz rápida, accesible y totalmente responsiva.

---

## 🚀 Características Principales

* **⏱️ Control Horario:** Sistema de fichaje (Entrada, Pausa, Salida) con registro de estado en tiempo real.
* **📅 Gestión de Ausencias:** Solicitud y aprobación de vacaciones, bajas médicas y permisos.
* **📋 Tablero de Tareas:** Gestión de proyectos y pendientes mediante sistema visual (tipo Kanban).
* **👥 Roles de Usuario:**
    * **Empleado:** Panel personal, fichajes y tareas.
    * **Jefe de Equipo:** Gestión de aprobaciones y supervisión de equipo.
    * **Administrador:** Control global, gestión de usuarios y configuraciones del sistema.
* **📱 Diseño "Mobile-First":** Interfaz optimizada para funcionar como una App nativa en dispositivos móviles.

---

## ⚡ Optimizaciones Técnicas (Lighthouse 96/100)

Este proyecto ha sido optimizado agresivamente para obtener la máxima puntuación en **Google Lighthouse** (Rendimiento, Accesibilidad, SEO y Best Practices).

### 🏎️ Rendimiento (Performance)
* **Critical CSS Inlining:** Los estilos críticos se han movido dentro del HTML para eliminar el bloqueo de renderizado (ahorro de ~140ms en carga móvil).
* **Carga Diferida de JavaScript:** Scripts con atributo `defer` para no detener la construcción del DOM.
* **Optimización de Fuentes:**
    * `Preload` de fuentes web críticas (`.woff2`).
    * Carga asíncrona de iconos FontAwesome para evitar parpadeos y bloqueos.

### 🔍 SEO y Metadatos
* **Metaetiquetas Completas:** Títulos, descripciones y palabras clave optimizadas por página.
* **Open Graph (OG):** Tarjetas enriquecidas para compartir en redes sociales (WhatsApp, LinkedIn, etc.).
* **Control de Indexación:**
    * `index, follow`: Para páginas públicas (Home, Login, Legal).
    * `noindex, follow`: Protección de páginas privadas (Dashboard, Perfil).

### ♿ Accesibilidad (A11y)
* **Contraste de Colores:** Ajuste de paleta a estándares WCAG (Azul `#0056b3` para legibilidad).
* **Viewport Escalable:** Configuración `maximum-scale=5.0` para permitir zoom en móviles.
* **Semántica HTML:** Uso correcto de etiquetas `<main>`, `<nav>`, `<header>` y `<footer>`.

---

# 📂 Estructura del Proyecto

```text
clockInTime/
├── 📄 index.html             # Landing Page (Optimizada)
├── 📁 CSS/                   # Hojas de estilo
│   ├── index.css            # Estilos de la landing
│   ├── login.css            # Estilos de autenticación
│   └── app-style.css        # Estilos globales de la App
├── 📁 JS/                    # Lógica de programación
│   ├── main.js              # Lógica principal (Cookies y scroll)
│   ├── theme.js             # Control de Modo Claro/Oscuro (Global)
│   ├── auth.js              # Validación de formularios Login/Registro
│   └── dashboard.js         # Lógica del panel (Reloj, tareas, etc.)
├── 📁 login/                 # Vistas de acceso
│   ├── login.html           # Inicio de sesión
│   ├── register.html        # Registro de usuarios
│   └── recuperar.html       # Recuperación de contraseña
├── 📁 legal/                 # Documentación legal
│   ├── terminos-servicio.html
│   ├── politica-privacidad.html
│   └── politica-cookies.html
└── 📄 dashboard.html         # Panel principal (App)
