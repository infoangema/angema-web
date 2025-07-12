# Descripción del Proyecto - Angema Web

## Visión General del Proyecto

**Angema Web** es una aplicación web híbrida que combina:
1. **Portfolio Corporativo** - Sitio web promocional de la empresa Angema
2. **StockIn Manager** - Sistema de gestión de inventario y productos empresarial

## Características Principales

### 🌐 Portfolio Corporativo
- **Diseño Moderno**: Interface responsive con Bootstrap 5 y TailwindCSS
- **Servicios**: Business Intelligence, desarrollo de software personalizado, aplicaciones hoteleras
- **Tecnologías Showcase**: Exhibición de tecnologías utilizadas (Angular, Flutter, etc.)
- **Contacto**: Sistema de formularios de contacto integrado

### 📦 StockIn Manager - Sistema de Gestión de Inventario

#### Arquitectura Multi-Tenant
- **Aislamiento por Negocio**: Cada empresa maneja sus datos independientemente
- **Roles y Permisos**: Sistema jerárquico (Root → Admin → User)
- **Seguridad**: Reglas de Firestore para aislamiento de datos

#### Módulos Implementados

##### 🔐 Autenticación y Autorización
- **Login con Firebase Auth**: Autenticación segura
- **Gestión de Roles**: 
  - **Root**: Acceso total, gestión multi-negocio
  - **Admin**: Gestión completa del negocio asignado
  - **User**: Acceso limitado de solo lectura
- **Persistencia de Sesión**: Estado mantenido entre recargas
- **Guards de Protección**: Rutas protegidas por roles

##### 🏢 Gestión de Negocios
- **Multi-Negocio**: Un root puede gestionar múltiples empresas
- **Selector de Negocio**: Interface para cambiar contexto empresarial
- **CRUD Completo**: Crear, leer, actualizar, eliminar negocios
- **Activación/Desactivación**: Control de estado de negocios

##### 📊 Dashboard Inteligente
- **Vista Contextual**: Información específica por negocio y rol
- **Métricas en Tiempo Real**: Estadísticas actualizadas automáticamente
- **Accesos Rápidos**: Navegación intuitiva a módulos principales

##### 🎨 Sistema de Atributos Dinámicos
- **Gestión Centralizada**: Administración de colores, tamaños y materiales
- **Opciones Predefinidas**: Catálogo pre-configurado para setup rápido
- **Personalización**: Creación de atributos personalizados por negocio
- **Validación**: Códigos únicos por tipo y negocio
- **Estados**: Activación/desactivación sin pérdida de datos
- **Permisos**: Solo admin y root pueden gestionar

##### 📦 Gestión de Productos (SKUs)
- **Productos Inteligentes**: Sistema completo de SKUs con atributos dinámicos
- **Generación Automática**: Códigos SKU generados automáticamente
- **Atributos Flexibles**: Colores, tamaños, materiales dinámicos
- **Control de Stock**: Niveles mínimos y máximos, ubicaciones
- **Costos y Precios**: Gestión financiera con permisos diferenciados
- **Búsqueda Avanzada**: Filtros múltiples y búsqueda por texto
- **Paginación**: Carga eficiente de grandes volúmenes
- **Estados**: Activación/desactivación de productos

##### 🏷️ Gestión de Categorías
- **Organización**: Clasificación de productos por categorías
- **Jerarquía**: Sistema de categorías estructurado
- **CRUD Completo**: Gestión total de categorías
- **Asignación**: Vinculación productos-categorías

##### 🏭 Gestión de Almacenes
- **Ubicaciones**: Múltiples almacenes por negocio
- **Organización**: Control de ubicaciones y posiciones
- **Trazabilidad**: Seguimiento de productos por almacén
- **Estados**: Activación/desactivación de almacenes

#### Funcionalidades Técnicas Avanzadas

##### 🔄 Sistema Reactivo
- **Tiempo Real**: Actualizaciones inmediatas usando Firestore listeners
- **Estado Sincronizado**: Cambios reflejados instantáneamente en todos los clientes
- **Optimistic Updates**: Interface responsive antes de confirmación del servidor

##### 🚀 Optimizaciones de Rendimiento
- **Lazy Loading**: Módulos cargados bajo demanda
- **Client-side Filtering**: Reducción de consultas complejas a Firestore
- **Paginación Inteligente**: Carga incremental de datos
- **Bundle Optimization**: Tamaño de aplicación optimizado

##### 🛡️ Seguridad
- **Firestore Rules**: Reglas de seguridad por rol y negocio
- **Validación**: Validación tanto cliente como servidor
- **Aislamiento**: Datos completamente aislados por negocio
- **Auditoría**: Timestamps automáticos para tracking

##### 📱 Experiencia de Usuario
- **Responsive Design**: Funciona perfectamente en móviles y desktop
- **Dark/Light Mode**: Tema adaptable
- **Notificaciones**: Sistema de feedback user-friendly
- **Loading States**: Indicadores de carga y estados de la aplicación

## Flujos de Trabajo Principales

### 👤 Flujo de Usuario Root
1. **Login** → Acceso total al sistema
2. **Selector de Negocio** → Elegir contexto empresarial
3. **Gestión Multi-Negocio** → Crear/gestionar múltiples empresas
4. **Vista Global** → Acceso a todos los datos de todos los negocios
5. **Administración** → Gestión de usuarios y permisos

### 👨‍💼 Flujo de Usuario Admin
1. **Login** → Acceso a su negocio asignado
2. **Dashboard** → Vista general del negocio
3. **Gestión Completa** → CRUD en productos, categorías, almacenes
4. **Atributos** → Configuración de colores, tamaños, materiales
5. **Reportes** → Análisis de inventario y ventas

### 👥 Flujo de Usuario Regular
1. **Login** → Acceso limitado a su negocio
2. **Consulta** → Solo lectura de productos y datos
3. **Búsqueda** → Localización de productos en inventario
4. **Reportes Básicos** → Vista de información no sensible

### 🔄 Flujo de Gestión de Productos
1. **Configurar Atributos** → Definir colores, tamaños, materiales
2. **Crear Categorías** → Organizar clasificaciones
3. **Configurar Almacenes** → Definir ubicaciones
4. **Crear Productos** → SKUs con atributos dinámicos
5. **Gestión de Stock** → Control de inventario
6. **Seguimiento** → Monitoreo en tiempo real

## Integración con Firebase

### 🔥 Firestore Database
- **Collections Principales**: users, businesses, products, attributes, categories, warehouses
- **Estructura Jerárquica**: Datos organizados por businessId
- **Reglas de Seguridad**: Acceso controlado por roles
- **Indexación**: Optimizada para consultas complejas

### 🔐 Firebase Authentication
- **Providers**: Email/Password principalmente
- **Custom Claims**: Roles almacenados en tokens
- **Session Management**: Persistencia automática

### 📁 Firebase Storage
- **Archivos**: Imágenes de productos, documentos
- **Organización**: Estructura por negocio
- **Seguridad**: Acceso controlado por autenticación

## Tecnologías y Dependencias

### 🅰️ Frontend Stack
- **Angular 19**: Framework principal con standalone components
- **TypeScript 5.7**: Lenguaje de programación tipado
- **RxJS 7.8**: Programación reactiva
- **Bootstrap 5.3.3**: Framework CSS base
- **TailwindCSS**: Utility-first CSS framework
- **Flowbite**: Componentes UI adicionales

### ☁️ Backend Stack
- **Firebase**: Backend as a Service completo
- **Firestore**: Base de datos NoSQL
- **Firebase Auth**: Autenticación
- **Firebase Storage**: Almacenamiento de archivos
- **Cloud Functions**: Lógica del servidor (futuro)

### 🚀 Deployment
- **Vercel**: Hosting y CI/CD
- **Automatic Deployments**: Deploy automático desde main branch
- **SPA Configuration**: Configuración para Single Page Application

## Roadmap y Futuras Funcionalidades

### 🎯 Próximas Implementaciones
- **Módulo de Órdenes**: Sistema completo de ventas
- **Gestión de Clientes**: CRM básico integrado
- **Reportes Avanzados**: Analytics y dashboards
- **Sistema de Puntos**: Programa de fidelización
- **Mobile App**: Aplicación móvil complementaria

### 🔧 Mejoras Técnicas Planificadas
- **PWA**: Progressive Web App capabilities
- **Offline Support**: Funcionalidad sin conexión
- **Cloud Functions**: Lógica del servidor
- **Advanced Analytics**: Métricas detalladas
- **Backup System**: Sistema de respaldos automático

### 📊 Integraciones Futuras
- **APIs de Pago**: Procesamiento de pagos
- **Sistemas ERP**: Integración con sistemas empresariales
- **E-commerce**: Catálogo público de productos
- **Notifications**: Push notifications
- **Email Marketing**: Automatización de marketing

## Métricas y KPIs

### 📈 Performance
- **Bundle Size**: < 2MB initial bundle
- **Load Time**: < 3 segundos primera carga
- **Real-time Updates**: < 500ms latencia
- **Mobile Performance**: Score > 90 en Lighthouse

### 👥 Usuario
- **Multi-tenant**: Soporte para 100+ negocios
- **Concurrent Users**: 1000+ usuarios simultáneos
- **Data Scalability**: Millones de productos
- **Uptime**: 99.9% disponibilidad

### 🔒 Seguridad
- **Data Isolation**: 100% aislamiento entre negocios
- **Access Control**: Permisos granulares por rol
- **Audit Trail**: Registro completo de cambios
- **Compliance**: Adherencia a mejores prácticas

## Conclusión

Angema Web representa una solución completa que combina la presentación corporativa con un sistema robusto de gestión de inventario. Su arquitectura multi-tenant, sistema de roles avanzado y tecnologías modernas lo posicionan como una herramienta empresarial escalable y eficiente.