# Biblioteca Escolar — MVP (Vue 3)

Prototipo funcional de la primera versión del sistema de gestión de la biblioteca escolar,
construido a partir del alcance definido en la **Etapa 6** del proyecto *Digitalización y gestión
de préstamos de la biblioteca escolar*.

La aplicación permite administrar el catálogo, registrar préstamos y devoluciones, gestionar
usuarios y obtener un reporte básico de circulación. Funciona sin backend: los datos se guardan en
`localStorage` del navegador para poder realizar el piloto y la demostración.

## Requisitos

- Node.js 18 o superior (probado con Node 22)
- npm 9 o superior

## Puesta en marcha

```bash
cd Etapa6DiseñoDelSistema/biblioteca-app
npm install
npm run dev
```

La aplicación queda disponible en <http://localhost:5173>.

### Scripts

| Script            | Descripción                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo con recarga automática.   |
| `npm run build`   | Compila la versión de producción en `dist/`.     |
| `npm run preview` | Sirve localmente la compilación de producción.   |

## Cuentas de demostración

| Rol              | Correo                                  | Contraseña   |
| ---------------- | --------------------------------------- | ------------ |
| Administrador/a  | `admin@biblioteca.edu.ar`               | `admin123`   |
| Bibliotecario/a  | `bibliotecario@biblioteca.edu.ar`       | `biblio123`  |
| Estudiante       | `estudiante@biblioteca.edu.ar`          | `alumno123`  |
| Docente          | `docente@biblioteca.edu.ar`             | `docente123` |

El inicio de sesión incluye accesos rápidos a cada cuenta para facilitar la demostración.

> **Importante:** las contraseñas se guardan en texto plano y la sesión en `localStorage`
> únicamente porque se trata de un prototipo académico. En producción deben usarse contraseñas
> cifradas (hash), sesiones del servidor y una base de datos real.

## Roles y permisos

| Función                                   | Administrador/a | Bibliotecario/a | Usuario |
| ----------------------------------------- | :-------------: | :-------------: | :-----: |
| Catálogo y ficha del libro                |        ✓        |        ✓        |    ✓    |
| Consultar mis préstamos e historial       |        ✓        |        ✓        |    ✓    |
| Panel de circulación                      |        ✓        |        ✓        |    —    |
| Registrar préstamos y devoluciones        |        ✓        |        ✓        |    —    |
| Gestionar libros e importar CSV           |        ✓        |        ✓        |    —    |
| Gestionar usuarios                        |        ✓        |        ✓        |    —    |
| Dar de baja usuarios                      |        ✓        |        —        |    —    |
| Reporte básico del período                |        ✓        |        ✓        |    —    |

El acceso a cada ruta se valida con guardas del router y con el permiso declarado en
`src/stores/auth.js`.

## Alcance del MVP

Funciones incluidas (M1–M10 de la Etapa 6):

1. Inicio de sesión con roles.
2. Catálogo con búsqueda, filtros por materia y disponibilidad.
3. Ficha del libro con sinopsis, ubicación y ejemplares disponibles.
4. Alta, edición y baja lógica de libros.
5. Importación y exportación de libros en CSV.
6. Alta, edición y baja lógica de usuarios.
7. Registro de préstamos con vencimiento a 14 días.
8. Registro de devoluciones con observaciones.
9. Panel de vencidos, por vencer y movimientos recientes.
10. Reporte básico mensual con exportación a CSV e impresión.

Reglas de negocio implementadas:

- Plazo estándar de **14 días**, editable al registrar el préstamo.
- Máximo de **3 préstamos activos** por usuario.
- La disponibilidad se calcula como **ejemplares − préstamos activos**.
- Un usuario no puede tener dos préstamos activos del mismo libro.
- No se puede dar de baja un libro ni un usuario con préstamos activos.
- No se pueden reducir los ejemplares por debajo de los préstamos activos.
- Las bajas son **lógicas**: conservan el historial y permiten reactivar.
- Solo el rol administrador/a puede dar de baja usuarios.

Quedan fuera de esta versión (postergados): descarga de PDF, reservas de ejemplares físicos,
notificaciones externas automáticas y estadísticas avanzadas.

## Estructura del proyecto

```
biblioteca-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/styles/main.css      # Sistema de diseño global y responsive
│   ├── components/
│   │   ├── BrandMark.vue
│   │   ├── catalog/BookCard.vue
│   │   ├── loans/EstadoPrestamo.vue
│   │   ├── staff/                  # Modales de libros, usuarios, préstamos, devoluciones y CSV
│   │   └── ui/                     # Modal, confirmación, estado vacío, stat, paginación, toasts
│   ├── data/                       # Datos semilla: libros, usuarios, préstamos, materias, configuración
│   ├── layouts/AppLayout.vue       # Barra lateral, topbar y navegación por rol
│   ├── router/index.js             # Rutas y guardas de autenticación y permisos
│   ├── stores/                     # Pinia: auth, books, users, loans, ui
│   ├── utils/                      # Fechas, almacenamiento, texto, CSV e IDs
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── CatalogView.vue
│   │   ├── BookDetailView.vue
│   │   ├── MyLoansView.vue
│   │   ├── NotFoundView.vue
│   │   └── staff/
│   │       ├── PanelView.vue
│   │       ├── CirculationView.vue
│   │       ├── BooksView.vue
│   │       ├── UsersView.vue
│   │       └── ReportsView.vue
│   ├── App.vue
│   └── main.js
├── index.html
├── jsconfig.json
├── package.json
└── vite.config.js
```

## Datos de ejemplo y persistencia

- Los datos semilla se cargan solo si no existe estado previo en el navegador.
- Los préstamos de ejemplo se generan en relación con la fecha actual, de modo que siempre hay
  casos vencidos, por vencer y devoluciones en el historial.
- Claves usadas en `localStorage`, con el prefijo `biblioteca-escolar:`:
  - `biblioteca-escolar:libros`
  - `biblioteca-escolar:usuarios`
  - `biblioteca-escolar:prestamos`
  - `biblioteca-escolar:sesion`
- Para reiniciar la demostración, borrá esas claves desde las herramientas del navegador
  (Application → Local Storage) y recargá la página.

## Recorrido sugerido para evaluar el MVP

1. Ingresar como **Administrador/a** y revisar el panel de circulación.
2. En **Circulación**, registrar un préstamo y luego una devolución.
3. En **Libros**, crear un libro y probar la importación CSV con la plantilla descargable.
4. En **Usuarios**, crear una cuenta de estudiante y verificar la baja lógica.
5. En **Reportes**, cambiar el período, exportar el CSV e imprimir el reporte.
6. Cerrar sesión e ingresar como **Estudiante** para ver el catálogo y los préstamos propios.
7. Comprobar la persistencia recargando la página.

## Notas técnicas

- Vue 3 (`<script setup>`), Vue Router 4, Pinia y Vite.
- Iconografía con `lucide-vue-next`.
- Sin dependencias de UI externas: el sistema de diseño es propio.
- Los formularios validan datos obligatorios, duplicados de ISBN y de correo, y reglas de
  circulación antes de guardar.
