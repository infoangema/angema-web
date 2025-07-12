# Estructura Técnica del Proyecto - Angema Web

## Información Técnica del Proyecto

**Proyecto**: Angema Web - Portfolio y StockIn Manager  
**Framework**: Angular 19 (Standalone Components)  
**Stack**: TypeScript 5.7, RxJS 7.8, Bootstrap 5.3.3, TailwindCSS, Flowbite  
**Backend**: Firebase (Firestore, Authentication, Storage)  
**Deployment**: Vercel  

## Arquitectura de la Aplicación

### Tipo de Aplicación
- **Single Page Application (SPA)** con routing del lado del cliente
- **Standalone Components**: Sin NgModules, usando standalone components con imports explícitos
- **Lazy Loading**: Módulos cargados bajo demanda
- **Responsive Design**: Bootstrap 5 + TailwindCSS + CSS personalizado

### Patrones Arquitectónicos

#### Routing
- Client-side routing con fallback a home page
- Wildcard routing para rutas desconocidas
- AuthGuards para protección de rutas
- Configuración SPA en Vercel

#### Gestión de Estado
- **LocalStorage**: Persistencia de estado del spinner
- **Services**: Estado compartido usando Angular services
- **RxJS Observables**: Flujo de datos reactivo
- **No State Management Library**: Usa servicios nativos de Angular

#### Servicios y Organización
- **Core Services**: Autenticación, base de datos, notificaciones
- **Module Services**: Servicios específicos por módulo (productos, categorías, etc.)
- **Shared Services**: Servicios reutilizables entre módulos

## Estructura de Directorios

### Core Structure
```
src/app/
├── core/                     # Núcleo de la aplicación
│   ├── guards/              # Protección de rutas
│   ├── models/              # Modelos de datos core
│   └── services/            # Servicios fundamentales
├── shared/                  # Componentes reutilizables
├── modules/                 # Módulos funcionales
└── config/                  # Configuraciones globales
```

### Módulo StockIn Manager
```
modules/stockin-manager/
├── components/              # Componentes del módulo
│   ├── shared/             # Navbar específico del módulo
│   └── business-selector-modal/
├── models/                 # Modelos de datos del módulo
├── pages/                  # Páginas/Componentes de ruta
├── services/               # Servicios específicos del módulo
└── stockin-manager.module.ts
```

### Páginas Implementadas
```
pages/
├── attributes/             # Gestión de atributos dinámicos
│   ├── create-attribute/   # Modal de creación
│   ├── edit-attribute/     # Modal de edición
│   └── attributes.page.ts  # Página principal
├── products/               # Gestión de productos
│   ├── create-product/     # Modal de creación
│   ├── edit-product/       # Modal de edición
│   ├── products-list/      # Lista de productos
│   └── products.page.ts    # Página principal
├── categories/             # Gestión de categorías
├── warehouses/             # Gestión de almacenes
├── dashboard/              # Panel principal
├── login/                  # Autenticación
└── root-admin/             # Administración root
```

## Modelos de Datos

### Firestore Collections

#### Users Collection
```typescript
interface UserProfile {
  uid: string;
  businessId: string;
  roleId: 'root' | 'admin' | 'user';
  email: string;
  displayName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Business Collection
```typescript
interface Business {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Products Collection (SKU)
```typescript
interface SKU {
  id: string;
  businessId: string;
  code: string;           // SKU generado automáticamente
  name: string;
  description?: string;
  category: string;       // ID de categoría
  color: string;          // Código de atributo
  size: string;           // Código de atributo
  material: string;       // Código de atributo
  grams: number;          // Campo en inglés
  cost: number;           // Solo admin/root
  price: number;
  stock: number;
  minStock: number;
  maxStock: number;
  position?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Attributes Collection
```typescript
interface Attribute {
  id: string;
  businessId: string;
  type: 'color' | 'size' | 'material';
  code: string;           // Ej: "ROJ", "XL", "ALG"
  name: string;           // Ej: "Rojo", "Extra Large", "Algodón"
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Categories Collection
```typescript
interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Warehouses Collection
```typescript
interface Warehouse {
  id: string;
  businessId: string;
  name: string;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Servicios Principales

### Core Services

#### DatabaseService
- **Propósito**: Abstracción para operaciones CRUD en Firestore
- **Métodos**: create, getById, update, delete, getAll, getWhere, query
- **Optimizaciones**: Client-side filtering, duplicate prevention
- **Uso**: Base para todos los servicios de datos

#### AuthService
- **Propósito**: Gestión de autenticación y autorización
- **Funcionalidades**: Login, logout, roles, permisos, sesión persistente
- **Guards**: Protección de rutas basada en roles

#### BusinessService
- **Propósito**: Gestión de negocios y contexto empresarial
- **Funcionalidades**: CRUD negocios, contexto actual, validaciones

### Module Services

#### AttributeService
- **Propósito**: Gestión de atributos dinámicos para productos
- **Funcionalidades**: CRUD atributos, filtrado por tipo, validación de códigos únicos
- **Business Logic**: Aislamiento por negocio, opciones predefinidas

#### ProductService
- **Propósito**: Gestión completa de productos (SKUs)
- **Funcionalidades**: CRUD productos, búsqueda, filtros, paginación
- **SKU Generation**: Generación automática de códigos SKU

## Configuraciones Técnicas

### Angular Configuration
```typescript
// angular.json - Build Configuration
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    }
  ]
}
```

### Firebase Configuration
```typescript
// firebase.config.ts
export const firebaseConfig = {
  // Configuración específica por environment
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // etc.
}
```

### Vercel Configuration
```json
// vercel.json - SPA Routing
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Convenciones de Desarrollo

### Angular 17+ Features
- **Control Flow**: `@for`, `@if`, `@else` en lugar de `*ngFor`, `*ngIf`
- **Standalone Components**: Sin NgModules
- **Imports explícitos**: Cada componente importa lo que necesita

### TypeScript
- **Strict Mode**: Compilación estricta habilitada
- **Type Safety**: Interfaces para todos los modelos
- **Generics**: DatabaseService con tipos genéricos

### Firestore Best Practices
- **Business Isolation**: Datos separados por businessId
- **Simple Queries**: Evitar índices complejos con client-side filtering
- **Real-time Updates**: Observable patterns para actualizaciones inmediatas

### Component Organization
- **Standalone**: Todos los componentes son standalone
- **Separation**: HTML, CSS y TS en archivos separados
- **Modular**: Componentes pequeños y cohesivos

## Performance Optimizations

### Bundle Size
- **Lazy Loading**: Módulos cargados bajo demanda
- **Tree Shaking**: Eliminación de código no usado
- **Bundle Analysis**: Límites de tamaño configurados

### Firestore Optimizations
- **Client-side Filtering**: Para evitar índices complejos
- **Pagination**: Carga incremental de datos
- **Real-time Subscriptions**: Solo donde es necesario

### UI/UX Optimizations
- **Responsive Design**: Mobile-first approach
- **Loading States**: Spinners y skeleton screens
- **Error Handling**: Notificaciones user-friendly