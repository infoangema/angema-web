# StockIn Manager - Estructura y Pasos de Desarrollo

NOTAS IMPORTANTE: 
Este proyecto se va a realizar 100% con el uso de IA por medio del uso de "Claude Code". Esta IA funciona mediante sesiones de chats,
no va a permanecer el contexto completo. Es por eso que como IA, cuando leas esto, entiende que en cada funcionalidad, metodo, clase que 
agregas, debes dejar documentado porque esta hecho, donde se usa y cualquier detalle que consideres que te sea util al abrir nuevo
chat donde esta informacion te va a ser muy util.

Otros Detalles:
- Solo agregar funcionalidades nuevas, no cambiar nada existente, ya que todo funciona correctamente.
- Si se necesita modificar algo, consultar con el usuario, para saber si no afecta otra cosa.
- Antes de crear un nuevo servicio, verificar si no existe en la estructura de carpetas de este archivo.
- Actualizar la estructura de carpetas inmediatamente que se agregua un cambio para nunca perder contexto.
- Por cada tarea realizada, vuelve a leer este archivo y actulizarlo, marcando los puntos realizados.
- Los nuevos componentes de angular que se creen deben tener su propio archivo de html y css por separados.
- siempre deben ser standalone.
- reemplazar el uso de "ngFor" ya que esta deprecado. "ngFor is deprecated, 20.0 Use the `@for` block instead. Intent to remove in v22"
- si te pido corregir un error. anota la solucion en la seccion de "### Errores resueltos:" para tener el contexto a futuro.

## Estructura de Carpetas

```
src/
├── app/
│   ├── banner-central/         # Componente banner central
│   │   ├── banner-central.component.html
│   │   └── banner-central.component.ts
│   │
│   ├── components/             # Componentes de la aplicación
│   │   ├── SVG/               # Componentes SVG
│   │   │   ├── svg-celular/
│   │   │   ├── svg-disenio-objetos/
│   │   │   ├── svg-disenio/
│   │   │   └── svg-monitor/
│   │   │
│   │   ├── botones/           # Componentes de botones
│   │   ├── contacto/          # Componente de contacto
│   │   ├── footer/            # Componente footer
│   │   ├── home/              # Componente home
│   │   │
│   │   ├── recursos/          # Recursos y utilidades
│   │   │   ├── secuencia/     # Animaciones de secuencia
│   │   │   └── texto-movil/   # Texto animado
│   │   │
│   │   ├── shared/            # Componentes compartidos
│   │   │   └── navbar/        # Barra de navegación
│   │   │
│   │   └── spinner/           # Componente spinner de carga
│   │
│   ├── config/                 # Configuraciones globales
│   │   ├── firebase.config.ts  # Configuración de Firebase
│   │   └── flowbite.config.ts  # Configuración de Flowbite
│   │
│   ├── core/                   # Núcleo de la aplicación
│   │   ├── guards/            # Guards de autenticación y roles
│   │   │   ├── auth.guard.ts
│   │   │   └── root.guard.ts
│   │   │
│   │   ├── interceptors/      # Interceptores HTTP (vacío)
│   │   │
│   │   ├── models/            # Modelos de datos
│   │   │   ├── business.model.ts
│   │   │   ├── contacto.model.ts
│   │   │   ├── roles.model.ts
│   │   │   ├── root-messages.model.ts
│   │   │   └── user-session.model.ts
│   │   │
│   │   └── services/          # Servicios core
│   │       ├── auth.service.ts
│   │       ├── business.service.ts
│   │       ├── database.service.ts
│   │       ├── firebase.service.ts
│   │       ├── local-storage.service.ts
│   │       ├── notification.service.ts
│   │       ├── root-messages.service.ts
│   │       ├── session-storage.service.ts
│   │       └── theme.service.ts
│   │
│   ├── models/                # Modelos adicionales
│   │   └── contacto.model.ts  # Modelo de contacto
│   │
│   ├── modules/               # Módulos funcionales
│   │   ├── marketing/         # Módulo de marketing
│   │   │   ├── components/
│   │   │   │   └── home/
│   │   │   └── marketing.module.ts
│   │   │
│   │   └── stockin-manager/   # Módulo principal StockIn
│   │       ├── components/    # Componentes del módulo
│   │       │   ├── business-selector-modal/  # Modal selector de negocio
│   │       │   │   └── business-selector-modal.component.ts
│   │       │   └── shared/    # Componentes compartidos
│   │       │       └── navbar.component.ts
│   │       │
│   │       ├── config/        # Configuraciones del módulo (vacío)
│   │       │
│   │       ├── models/        # Modelos del módulo
│   │       │   ├── category.model.ts
│   │       │   ├── sku.model.ts
│   │       │   └── warehouse.model.ts
│   │       │
│   │       ├── pages/         # Páginas del módulo
│   │       │   ├── complete-profile/
│   │       │   ├── complete-registration/
│   │       │   ├── customers/
│   │       │   ├── dashboard/
│   │       │   ├── login/
│   │       │   ├── orders/
│   │       │   ├── products/
│   │       │   │   └── products-list/
│   │       │   ├── reports/
│   │       │   └── root-admin/
│   │       │
│   │       ├── services/      # Servicios específicos del módulo
│   │       │   ├── category.service.ts
│   │       │   ├── modal.service.ts
│   │       │   ├── product.service.ts
│   │       │   ├── root-business-selector.service.ts
│   │       │   └── warehouse.service.ts
│   │       │
│   │       └── stockin-manager.module.ts
│   │
│   ├── servicio/              # Servicios legacy
│   │   ├── contacto.service.spec.ts
│   │   ├── contacto.service.ts
│   │   └── trabajos.service.ts
│   │
│   └── shared/                # Componentes y utilidades compartidas
│       ├── components/        # Componentes reutilizables
│       │   ├── botones/
│       │   ├── contacto/
│       │   ├── footer/
│       │   ├── navbar/
│       │   └── notifications/
│       │
│       ├── directives/        # Directivas personalizadas (vacío)
│       └── pipes/             # Pipes personalizados (vacío)
│
└── assets/                    # Recursos estáticos
    ├── css/                   # Estilos CSS
    │   ├── bootstrap.css
    │   ├── main.css
    │   └── pe-icon-7-stroke.css
    │
    ├── fonts/                 # Fuentes
    │   ├── Pe-icon-7-stroke.*
    │   └── glyphicons-halflings-regular.*
    │
    ├── images/                # Imágenes generales
    │   └── home-image.jpg
    │
    ├── img/                   # Imágenes específicas
    │   └── [múltiples archivos de imagen]
    │
    ├── js/                    # Scripts JavaScript
    │   ├── awesome-landing-page.js
    │   ├── bootstrap.js
    │   ├── jquery-1.10.2.js
    │   └── jquery-ui-1.10.4.custom.min.js
    │
    ├── lineicons/             # Iconos lineales
    │   ├── fonts/
    │   ├── index.html
    │   ├── lte-ie7.js
    │   └── style.css
    │
    └── video/                 # Videos
        └── appHotel.mp4
```

## Pasos de Desarrollo

### 1. Configuración Inicial ✅
- [x] Crear proyecto Angular
- [x] Configurar TailwindCSS y Flowbite
- [x] Configurar Firebase
- [x] Configurar rutas principales
- [x] Implementar estructura base de carpetas

### 2. Autenticación y Autorización ✅
- [x] Implementar AuthService
- [x] Crear guards de autenticación
- [x] Configurar reglas de Firestore
- [x] Implementar manejo de roles
- [x] Crear componente de login
- [x] Implementar persistencia de sesión

### 3. Gestión de Negocios ✅
- [x] Crear modelos de datos
- [x] Implementar BusinessService
- [x] Crear componentes de gestión
- [x] Implementar CRUD de negocios
- [x] Configurar permisos por negocio

### 4. Panel de Administración Root ✅
- [x] Crear componente RootAdmin
- [x] Implementar gestión de usuarios
- [x] Implementar gestión de negocios
- [x] Configurar permisos especiales

### 5. Módulo de Productos 🔄: Tareas detalladas en "5. modulo de productos.md"
- [x] Crear modelo de productos en "src/app/modules/stockin-manager/models" segun archivo "dev-plan.md"
- [x] Implementar ProductService
- [x] Crear componentes CRUD: Falta crear boton de crear categoria y crear almacen.
- [x] Implementar búsqueda y filtros
- [x] Agregar gestión de categorías
- [ ] Implementar control de stock
- [ ] Implementar vista de lista con selección múltiple
- [x] Agregar columnas de costo (solo ve admin y root) y negocio (solo ve root)
- [x] Visualizar productos por negocio para root con selector modal
- [x] Resolver problema de usuarios root al acceder páginas de categorías y almacenes

### 6. Módulo de Órdenes
- [ ] Crear modelo de órdenes
- [ ] Implementar OrderService
- [ ] Crear componentes de gestión
- [ ] Implementar proceso de venta
- [ ] Agregar seguimiento de estado

### 7. Módulo de Clientes
- [ ] Crear modelo de clientes
- [ ] Implementar CustomerService
- [ ] Crear componentes CRUD
- [ ] Agregar historial de compras
- [ ] Implementar sistema de puntos

### 8. Módulo de Reportes
- [ ] Diseñar estructura de datos
- [ ] Implementar ReportService
- [ ] Crear componentes de visualización
- [ ] Agregar gráficos y estadísticas
- [ ] Implementar exportación de datos

### 9. Mejoras y Optimizaciones
- [ ] Implementar caché de datos
- [ ] Optimizar consultas a Firestore
- [ ] Agregar lazy loading
- [ ] Implementar PWA
- [ ] Mejorar UX/UI

### 10. Testing y Documentación
- [ ] Escribir tests unitarios
- [ ] Implementar tests e2e
- [ ] Documentar componentes
- [ ] Crear guía de usuario
- [ ] Documentar API

## Gestión de Cambios y Versionado

### CHANGELOG.md
- Mantener actualizado el archivo CHANGELOG.md en la raíz del proyecto
- Formato basado en [Keep a Changelog](https://keepachangelog.com/)
- Documentar todos los cambios importantes por versión
- Incluir errores corregidos, nuevas funcionalidades y archivos modificados

### Comandos útiles para versionado:
- `date +%Y-%m-%d` - Obtener fecha actual del sistema (formato YYYY-MM-DD)
- `git branch --show-current` - Obtener nombre del branch actual
- `git status` - Ver estado actual del repositorio
- `git log --oneline -5` - Ver últimos 5 commits en una línea

### Estructura de entrada en CHANGELOG:
```markdown
## [version] - YYYY-MM-DD

### Agregado
- Nueva funcionalidad X

### Corregido  
- Error Y solucionado
- Bug Z corregido

### Archivos modificados
- path/to/file.ts - Descripción del cambio
```

## Notas Técnicas

### Firebase
- Usar Firestore para datos principales
- Implementar reglas de seguridad por rol
- Configurar índices para consultas complejas
- Usar Storage para archivos

### Angular
- Usar standalone components
- Implementar lazy loading
- Seguir guía de estilos oficial
- Mantener módulos pequeños y cohesivos

### UI/UX
- Seguir guía de diseño de Tailwind
- Mantener consistencia visual
- Implementar diseño responsive
- Optimizar para móviles

### Seguridad
- Validar inputs del usuario
- Sanitizar datos
- Implementar rate limiting
- Mantener dependencias actualizadas

### Errores resueltos:

#### Error: Firestore Tracking Expressions y Duplicate Keys (Enero 2025)
**Problema**: Al intentar actualizar precios de productos, aparecían errores en consola:
- `NG6055: The provided track expression resulted in duplicated keys`
- `Error updating document: FirebaseError: Invalid document reference`
- `Error updating product: FirebaseError: Invalid document reference`

**Causa**: 
1. Las consultas complejas de Firestore estaban devolviendo documentos duplicados
2. El array `products` en el componente contenía elementos con IDs duplicados
3. Los tracking expressions de Angular no podían manejar los duplicados en `@for` loops

**Solución aplicada**:
1. **En DatabaseService**: Agregado filtro de duplicados en métodos `query()` y `getOnce()` usando `Set` para verificar IDs únicos
2. **En ProductService**: Simplificado `getProductsByBusiness()` para evitar consultas complejas que causan duplicados
3. **En ProductsListComponent**: Agregado verificación de duplicados al cargar más productos en paginación
4. **Reducido logs de debug**: Eliminados console.log excesivos que generaban ruido

**Archivos modificados**:
- `src/app/core/services/database.service.ts` - Filtros de duplicados
- `src/app/modules/stockin-manager/services/product.service.ts` - Consultas simplificadas  
- `src/app/modules/stockin-manager/pages/products/products-list/products-list.component.ts` - Prevención duplicados

**Resultado**: Eliminados errores de tracking y las actualizaciones de productos funcionan correctamente.

#### Error: TypeScript Property 'id' does not exist on type 'T' (Enero 2025)
**Problema**: Después de corregir duplicados, aparecían errores de TypeScript:
- `TS2339: Property 'id' does not exist on type 'T'`
- `TS4111: Property 'id' comes from an index signature, so it must be accessed with ['id']`

**Causa**: TypeScript no puede inferir que el tipo genérico `T` tenga la propiedad `id`

**Solución**: Usado type assertion `(doc as any).id` e `(item as any).id` para acceder a la propiedad id de forma segura

**Archivos modificados**:
- `src/app/core/services/database.service.ts` - Type assertions para acceso a `id`

**Resultado**: Build exitoso sin errores de TypeScript.

#### Proceso de documentación de cambios (Enero 2025)
**Implementado**: Sistema de gestión de cambios y versionado
- Creado CHANGELOG.md en la raíz del proyecto siguiendo estándar Keep a Changelog
- Documentados todos los errores corregidos en la versión v.0.5.4
- Agregadas tareas de mantenimiento de changelog en steps.md
- Incluidos comandos útiles para obtener fecha y branch actual

**Comandos documentados**:
- `date +%Y-%m-%d` - Fecha actual del sistema
- `git branch --show-current` - Branch actual
- Estructura estándar para entradas de changelog

**Archivos creados/modificados**:
- `CHANGELOG.md` - Nuevo archivo de registro de cambios
- `doc/steps.md` - Agregada sección de gestión de cambios

**Propósito**: Mantener historial detallado de cambios para contexto futuro en desarrollo con IA.

