# Estructura Técnica del Proyecto - Angema Web

## Información Técnica del Proyecto

**Proyecto**: Angema Web - Portfolio y StockIn Manager  
**Framework**: Angular 19 (Standalone Components)  
**Stack**: TypeScript 5.7, RxJS 7.8, Bootstrap 5.3.3, TailwindCSS, Flowbite  
**Backend**: Firebase (Firestore + Realtime Database, Authentication, Storage)  
**Deployment**: Vercel  
**Optimizations**: Intelligent caching, session control, change detection  

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
- **LocalStorage**: Persistencia de estado del spinner y cache de clientes
- **SessionStorage**: Cache de productos y datos de sesión
- **Memory Cache**: Cache temporal para datos estáticos (negocios)
- **Services**: Estado compartido usando Angular services
- **RxJS Observables**: Flujo de datos reactivo
- **No State Management Library**: Usa servicios nativos de Angular

#### Servicios y Organización
- **Core Services**: Autenticación, base de datos, notificaciones, cache, sesiones
- **Module Services**: Servicios específicos por módulo (productos, categorías, etc.)
- **Shared Services**: Servicios reutilizables entre módulos
- **Firebase Optimization Services**: Cache, change detection, session control, metrics

#### NotificationService - Métodos Disponibles
**IMPORTANTE**: Para evitar errores recurrentes con nombres de métodos, usar siempre:

```typescript
// Métodos principales (sin prefijo "show")
notificationService.success(message: string, duration?: number)
notificationService.error(message: string, duration?: number)  
notificationService.warning(message: string, duration?: number)
notificationService.info(message: string, duration?: number)

// Métodos alternativos (con prefijo "show")  
notificationService.showSuccess(message: string, duration?: number)
notificationService.showError(message: string, duration?: number)
notificationService.showInfo(message: string, duration?: number)
// ❌ NO EXISTE: notificationService.showWarning() 

// Métodos adicionales
notificationService.removeNotification(id: string)
notificationService.clearAll()
```

**Ejemplos de uso correcto:**
```typescript
// ✅ Correcto - métodos principales
this.notificationService.success('Orden creada exitosamente');
this.notificationService.error('Error al cargar productos');
this.notificationService.warning('Stock insuficiente');

// ✅ Correcto - métodos alternativos
this.notificationService.showSuccess('Orden creada exitosamente');
this.notificationService.showError('Error al cargar productos');

// ❌ Incorrecto - método inexistente
this.notificationService.showWarning('Mensaje'); // NO EXISTE
```

#### DatabaseService - Manejo de Timestamps y Campos Undefined
**IMPORTANTE**: El DatabaseService maneja automáticamente:

```typescript
// Conversión segura de timestamps
private convertToDate(timestamp: any): Date | undefined {
  // Maneja: Date objects, Firestore Timestamps, objetos con seconds, strings/numbers
}

// Filtrado automático de campos undefined
private removeUndefinedFields(obj: any): any {
  // Preserva: Timestamps de Firestore, Date objects, valores válidos
  // Remueve: campos undefined que causan errores en Firebase
}
```

**Beneficios automáticos:**
- ✅ Previene errores de Firebase por campos undefined
- ✅ Convierte timestamps de Firestore a Date objects
- ✅ Preserva objetos Date y Timestamps válidos
- ✅ Aplicado automáticamente en create() y update()
- ✅ Manejo robusto de diferentes formatos de fecha

#### Firestore - Estrategia de Consultas Sin Índices Compuestos
**IMPORTANTE**: Para evitar errores de índices faltantes en Firestore:

```typescript
// ✅ Consultas simples (sin índices necesarios)
databaseService.getWhere('orders', 'businessId', '==', businessId);
databaseService.getAll('orders', 'createdAt', 'desc');

// ❌ Consultas complejas (requieren índices)
// getWithQuery('orders', where('businessId', '==', id), orderBy('createdAt', 'desc'))

// Estrategia adoptada: 
// 1. Consultas simples en Firebase
// 2. Filtrado y ordenamiento del lado del cliente
// 3. Usuarios root: consulta sin filtros + filtrado local
```

**Ventajas de esta estrategia:**
- ✅ Sin errores de índices faltantes
- ✅ Queries en tiempo real funcionales  
- ✅ Filtrado complejo del lado del cliente
- ✅ Soporte completo para usuarios root
- ✅ Performance aceptable para volúmenes medianos

#### Cache Cross-Service - Invalidación Inteligente
**IMPORTANTE**: Invalidación automática de cache entre servicios relacionados:

```typescript
// OrderService invalida cache de productos cuando afecta stock:
async createOrder() {
  // ... crear orden y reservar stock
  this.invalidateOrderCache(businessId);
  await this.productService.invalidateProductCache(businessId); // ✅ Cross-service
}

async updateOrder() {
  // ... cambiar estado de orden (delivered/cancelled)
  if (status === 'delivered' || status === 'cancelled') {
    await this.productService.invalidateProductCache(businessId); // ✅ Cross-service
  }
}

// ProductService método público para invalidación externa:
async invalidateProductCache(businessId?: string): Promise<void> {
  this.changeDetectionService.invalidateCollection('products', businessId);
}
```

**Beneficios de invalidación cross-service:**
- ✅ Cache siempre actualizado entre módulos relacionados
- ✅ Stock actualizado en página de productos después de crear órdenes
- ✅ Sincronización automática sin intervención manual
- ✅ Datos consistentes en toda la aplicación
- ✅ UX mejorada con información siempre actualizada

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
├── customers/              # Gestión de clientes/CRM
│   ├── create-customer/    # Modal de creación
│   ├── edit-customer/      # Modal de edición
│   ├── customers-list/     # Lista de clientes
│   ├── customer-history/   # Historial de compras
│   ├── customer-segments/  # Segmentación de clientes
│   └── customers.page.ts   # Página principal
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

#### Customers Collection
```typescript
interface Customer {
  id: string;
  businessId: string;
  code: string;           // Código único generado automáticamente
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType?: 'dni' | 'passport' | 'license' | 'ruc' | 'other';
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: 'individual' | 'business' | 'wholesale' | 'vip';
  isActive: boolean;
  creditLimit: number;
  loyaltyPoints: number;
  totalPurchases: number;
  customerSince: Date;
  lastPurchaseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Servicios Principales

### Firebase Optimization Services

#### CacheService
- **Propósito**: Sistema de cache multi-nivel con TTL automático
- **Storage Types**: memory, localStorage, sessionStorage
- **Funcionalidades**: Set/Get con TTL, limpieza automática, invalidación
- **Métodos**: `set()`, `get()`, `invalidate()`, `cleanup()`
- **Uso**: Cache inteligente para reducir consultas Firebase

#### ChangeDetectionService
- **Propósito**: Detección de cambios y control de freshness de datos
- **Funcionalidades**: Tracking de actualización, invalidación por colección
- **Freshness Threshold**: 10 minutos para considerar datos frescos
- **Métodos**: `needsRefresh()`, `markAsUpdated()`, `invalidateCollection()`
- **Uso**: Determinar cuándo usar cache vs hacer nueva consulta

#### CacheInvalidationService
- **Propósito**: Invalidación automática de cache según reglas predefinidas
- **Reglas**: 7 patrones de invalidación (customers, products, etc.)
- **Funcionalidades**: Invalidación por eventos, patrones regex
- **Métodos**: `invalidateByEvent()`, `shouldInvalidate()`
- **Uso**: Mantener consistencia de cache con cambios de datos

#### **OrderStatesService** (Nuevo)
- **Propósito**: Manejo de estados desde archivo JSON estático
- **Zero Firebase reads**: Estados cargan desde `/src/assets/data/order-states.json`
- **Ubicación**: `src/app/modules/stockin-manager/services/order-states.service.ts`
- **Beneficios**: Performance optimizada, configuración centralizada
- **Arquitectura**:
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Component     │    │   Service       │    │  JSON Config    │
│   orders.page   │    │ OrderStatesServ │    │ order-states.js │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Load config        │                       │
         │ ────────────────────▶ │ 2. HTTP Request       │
         │                       │ ────────────────────▶ │
         │ 3. Get statuses       │ 4. Return JSON        │
         │ ────────────────────▶ │ ◀─────────────────── │
         │ 4. Return options     │                       │
         │ ◀────────────────────│                       │
```

#### SessionControlService
- **Propósito**: Control de sesiones concurrentes usando Firebase Realtime Database
- **Funcionalidades**: Límites por plan, detección de desconexión
- **Planes**: Basic (1), Premium (5), Enterprise (ilimitado)
- **Métodos**: `registerSession()`, `removeSession()`, `getActiveSessions()`
- **Uso**: Prevenir conexiones concurrentes no autorizadas

#### FirebaseMetricsService
- **Propósito**: Tracking de métricas de uso de Firebase
- **Funcionalidades**: Conteo de reads, cache hits, tiempos de respuesta
- **Métodos**: `trackFirebaseRead()`, `trackCacheHit()`, `trackResponseTime()`
- **Uso**: Monitoreo de optimizaciones y costos

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
- **Optimizations**: Memory cache (30 min TTL), static data optimization

### Module Services

#### AttributeService
- **Propósito**: Gestión de atributos dinámicos para productos
- **Funcionalidades**: CRUD atributos, filtrado por tipo, validación de códigos únicos
- **Business Logic**: Aislamiento por negocio, opciones predefinidas

#### ProductService
- **Propósito**: Gestión completa de productos (SKUs)
- **Funcionalidades**: CRUD productos, búsqueda, filtros, paginación
- **SKU Generation**: Generación automática de códigos SKU
- **Optimizations**: SessionStorage cache (15 min TTL), lazy loading, client-side filtering

#### CustomerService
- **Propósito**: Gestión completa de clientes/CRM
- **Funcionalidades**: CRUD clientes, búsqueda, filtros, exportación CSV
- **Features**: Puntos de fidelización, segmentación, historial de compras
- **Business Logic**: Aislamiento por negocio, códigos únicos de cliente
- **Optimizations**: LocalStorage cache (10 min TTL), persistence between sessions

#### RootBusinessSelectorService
- **Propósito**: Gestión de selección de negocio para usuarios root
- **Funcionalidades**: Selección reactiva, persistencia en sesión
- **Features**: Observable de cambios, validación de selección

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

### Firebase Optimizations
- **Intelligent Caching**: 80-90% reducción en Firebase reads
  - **CustomerService**: LocalStorage cache (10 min TTL)
  - **ProductService**: SessionStorage cache (15 min TTL)
  - **BusinessService**: Memory cache (30 min TTL)
- **Client-side Filtering**: Evita índices complejos en Firestore
- **Lazy Loading**: Carga única con filtrado local
- **Session Control**: Previene conexiones concurrentes no autorizadas
- **Change Detection**: Invalidación inteligente de cache
- **Dual Firebase Architecture**: Firestore + Realtime Database según uso

### Cache Strategy
- **Multi-level Storage**: Memory > SessionStorage > LocalStorage
- **TTL Automatic**: Limpieza automática de cache expirado
- **Invalidation Rules**: 7 patrones automáticos de invalidación
- **Freshness Control**: 10 minutos threshold para datos frescos

### UI/UX Optimizations
- **Responsive Design**: Mobile-first approach
- **Loading States**: Spinners y skeleton screens
- **Error Handling**: Notificaciones user-friendly
- **Session Limits**: UI completa para gestión de sesiones por plan

---

## 📖 Guías de Uso de Servicios

### CacheService

#### Propósito
Gestiona cache multi-nivel con TTL automático para optimizar consultas Firebase.

#### Uso Básico
```typescript
// Set cache con TTL (en milisegundos)
this.cacheService.set('products_123', products, 15 * 60 * 1000, 'sessionStorage');

// Get cache
const cached = this.cacheService.get<Product[]>('products_123', 'sessionStorage');

// Invalidar cache específico
this.cacheService.invalidate('products_123', 'sessionStorage');

// Limpiar cache expirado
this.cacheService.cleanup();
```

#### Storage Types
- **memory**: Más rápido, se pierde al recargar página
- **sessionStorage**: Persiste durante la sesión del navegador
- **localStorage**: Persiste entre sesiones del navegador

#### Patrones de Implementación
```typescript
// En servicios de datos
getDataWithCache(businessId: string): Observable<T[]> {
  const cacheKey = `data_${businessId}`;
  
  // Verificar si necesita refresh
  if (!this.changeDetectionService.needsRefresh('data', businessId)) {
    const cached = this.cacheService.get<T[]>(cacheKey, 'sessionStorage');
    if (cached) {
      return of(cached);
    }
  }
  
  // Fetch fresh data
  return this.fetchFromFirebase(businessId).pipe(
    tap(data => {
      this.cacheService.set(cacheKey, data, 15 * 60 * 1000, 'sessionStorage');
      this.changeDetectionService.markAsUpdated('data', businessId);
    })
  );
}
```

### ChangeDetectionService

#### Propósito
Controla la freshness de datos y determina cuándo usar cache vs hacer nuevas consultas.

#### Uso Básico
```typescript
// Verificar si necesita refresh
if (this.changeDetectionService.needsRefresh('products', businessId)) {
  // Hacer nueva consulta
  const data = await this.fetchFromFirebase();
  
  // Marcar como actualizado
  this.changeDetectionService.markAsUpdated('products', businessId);
}

// Invalidar cache cuando hay cambios
this.changeDetectionService.invalidateCollection('products', businessId);
```

#### Configuración
- **Freshness Threshold**: 10 minutos por defecto
- **Storage**: SessionStorage para persistir entre navegación
- **Scope**: Por colección y businessId

### SessionControlService

#### Propósito
Controla sesiones concurrentes usando Firebase Realtime Database según plan de negocio.

#### Uso Básico
```typescript
// Registrar sesión (automático en login)
const result = await this.sessionControlService.registerSession();
if (!result.success) {
  console.log('Sesión bloqueada:', result.message);
  // Mostrar UI de límite de sesiones
}

// Obtener sesiones activas (solo admins)
const sessions = await this.sessionControlService.getActiveSessions(businessId);

// Forzar cierre de sesión
await this.sessionControlService.forceRemoveSession(businessId, sessionId);
```

#### Límites por Plan
- **Basic**: 1 sesión concurrente
- **Premium**: 5 sesiones concurrentes  
- **Enterprise**: Ilimitado

### FirebaseMetricsService

#### Propósito
Trackea métricas de uso de Firebase para monitorear optimizaciones.

#### Uso Básico
```typescript
// Track Firebase read
this.firebaseMetricsService.trackFirebaseRead('products', businessId);

// Track cache hit
this.firebaseMetricsService.trackCacheHit('products', businessId);

// Track response time
this.firebaseMetricsService.trackResponseTime('products_fetch', responseTime);

// Get metrics
const metrics = this.firebaseMetricsService.getMetrics();
```

### RootBusinessSelectorService

#### Propósito
Gestiona la selección de negocio para usuarios root, permitiendo cambiar entre diferentes negocios o ver datos agregados de todos.

#### Uso Básico
```typescript
// En un servicio que necesita filtrar por negocio
constructor(private rootBusinessSelector: RootBusinessSelectorService) {}

// Para usuarios root - Obtener selección actual
const businessId = this.rootBusinessSelector.getEffectiveBusinessId();

// Escuchar cambios en la selección
this.rootBusinessSelector.selection$.subscribe(selection => {
  console.log('Nueva selección:', selection);
});
```

#### Patrones de Implementación

##### 1. Servicios Reactivos (Recomendado)
```typescript
// En servicios de datos como CustomerService, ProductService, etc.
watchData(): Observable<T[]> {
  const isRoot = this.authService.isRoot();

  if (isRoot) {
    // Reactivo a cambios de selección
    return this.rootBusinessSelector.selection$.pipe(
      switchMap(selection => {
        const businessId = selection.showAll ? null : selection.businessId;
        
        if (businessId) {
          return this.databaseService.getWhere<T>('collection', 'businessId', '==', businessId);
        } else if (selection.showAll) {
          return this.databaseService.getAll<T>('collection');
        } else {
          return of([]); // No hay selección válida
        }
      })
    );
  } else {
    // Para usuarios no-root, usar businessId fijo
    return from(this.businessService.getCurrentBusinessId()).pipe(
      switchMap(id => this.databaseService.getWhere<T>('collection', 'businessId', '==', id))
    );
  }
}
```

##### 2. Métodos CRUD
```typescript
async createData(data: T): Promise<string> {
  const isRoot = this.authService.isRoot();
  let businessId: string | null = null;

  if (isRoot) {
    businessId = this.rootBusinessSelector.getEffectiveBusinessId();
  } else {
    businessId = await this.businessService.getCurrentBusinessId();
  }

  if (!businessId) {
    throw new Error('No se encontró el ID del negocio');
  }

  return this.databaseService.create('collection', { ...data, businessId });
}
```

#### Estados de Selección

| Estado | `businessId` | `showAll` | Comportamiento |
|--------|--------------|-----------|----------------|
| Sin selección | `null` | `false` | Mostrar vacío o requerir selección |
| Negocio específico | `string` | `false` | Filtrar por businessId |
| Ver todos | `null` | `true` | Mostrar todos los negocios |

#### Validación de Selección
```typescript
// Verificar si hay una selección válida
if (!this.rootBusinessSelector.hasValidSelection()) {
  // Mostrar modal de selección o redirigir
  this.openBusinessSelector();
}
```

### ModalService

#### Propósito
Gestiona modales dinámicos creados programáticamente, especialmente para el navbar y componentes compartidos.

#### Setup Requerido
```typescript
// En cada página que incluye navbar o usa modales dinámicos
import { ViewContainerRef, AfterViewInit } from '@angular/core';

export class PageComponent implements AfterViewInit {
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;

  constructor(private modalService: ModalService) {}

  ngAfterViewInit() {
    this.modalService.setModalContainer(this.modalContainer);
  }
}
```

```html
<!-- En el template de la página -->
<!-- Modal Container for Dynamic Modals -->
<div #modalContainer></div>
```

#### Uso Básico
```typescript
// Abrir modal dinámico
await this.modalService.open(BusinessSelectorModalComponent);

// Con datos
await this.modalService.open(EditModalComponent, { itemId: '123' });

// Cerrar modal
this.modalService.closeModal();
```

#### Compatibilidad Dual en Componentes de Modal
```typescript
// En componentes que se usan tanto dinámicamente como con binding directo
@Output() modalClosed = new EventEmitter<void>();

closeModal(): void {
  // Emitir evento para modales con binding directo
  this.modalClosed.emit();
  
  // También usar ModalService para modales dinámicos
  try {
    this.modalService.closeModal();
  } catch (error) {
    console.log('ModalService not available, using direct event emission');
  }
}
```

### CustomerService

#### Propósito
Gestiona operaciones CRUD para clientes con aislamiento por negocio y funcionalidades de CRM.

#### Características Principales
- **Aislamiento por Negocio**: Datos separados por `businessId`
- **Reactivo**: Se actualiza automáticamente con cambios de selección de negocio
- **CRM Features**: Puntos de fidelización, segmentación, historial
- **Export**: Exportación a CSV

#### Uso Básico
```typescript
// Observar clientes (reactivo)
this.customerService.watchCustomers().subscribe(customers => {
  console.log('Clientes:', customers);
});

// Crear cliente
await this.customerService.createCustomer({
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  customerType: 'individual'
});

// Actualizar cliente
await this.customerService.updateCustomer(customerId, {
  phone: '+1234567890'
});
```

#### Búsqueda y Filtros
```typescript
// Búsqueda con filtros
const filters: CustomerFilters = {
  search: 'juan',
  type: 'individual',
  active: true,
  city: 'Madrid'
};

this.customerService.searchCustomers(filters).subscribe(results => {
  console.log('Resultados:', results);
});
```

#### Funcionalidades CRM
```typescript
// Actualizar puntos de fidelización
await this.customerService.updateLoyaltyPoints(customerId, 100, 'add');

// Actualizar total de compras
await this.customerService.updateTotalPurchases(customerId, 299.99);

// Estadísticas
this.customerService.getCustomerStats().subscribe(stats => {
  console.log('Estadísticas:', stats);
});

// Exportar a CSV
const csvContent = await this.customerService.exportCustomersToCSV();
```

### DatabaseService

#### Propósito
Capa de abstracción para operaciones Firestore con optimizaciones y filtrado de duplicados.

#### Métodos Principales

##### Operaciones CRUD
```typescript
// Crear documento
const id = await this.databaseService.create('collection', data);

// Obtener por ID
const item = await this.databaseService.getById<T>('collection', id);

// Actualizar
await this.databaseService.update('collection', id, updateData);

// Soft delete
await this.databaseService.softDelete('collection', id);
```

##### Consultas Reactivas
```typescript
// Observar todos los documentos
this.databaseService.getAll<T>('collection').subscribe(items => {
  console.log('Items:', items);
});

// Observar con filtro WHERE
this.databaseService.getWhere<T>('collection', 'field', '==', 'value')
  .subscribe(items => {
    console.log('Filtered items:', items);
  });
```

##### Consultas Una Sola Vez
```typescript
// Obtener una sola vez (Promise)
const items = await this.databaseService.getOnce<T>('collection');

// Con filtros
const filtered = await this.databaseService.getOnce<T>(
  'collection', 
  where('field', '==', 'value')
);
```

##### Consultas Complejas con Paginación
```typescript
const result = await this.databaseService.query<T>('collection', {
  where: [
    { field: 'status', operator: '==', value: 'active' },
    { field: 'category', operator: '==', value: 'electronics' }
  ],
  orderBy: [
    { field: 'createdAt', direction: 'desc' }
  ],
  pageSize: 10,
  startAfter: lastDoc
});

console.log('Items:', result.items);
console.log('Has more:', result.hasMore);
```

#### Mejores Prácticas

##### 1. Aislamiento por Negocio
```typescript
// Siempre incluir businessId en operaciones multi-tenant
const data = {
  ...userData,
  businessId: await this.getBusinessId()
};
```

##### 2. Filtrado de Duplicados Automático
```typescript
// El DatabaseService automáticamente filtra duplicados
// No es necesario implementar lógica adicional
const items = await this.databaseService.getOnce<T>('collection');
// items garantizado sin duplicados
```

##### 3. Manejo de Timestamps
```typescript
// NO incluir createdAt/updatedAt manualmente
const data = {
  name: 'Product',
  price: 100
  // createdAt y updatedAt se agregan automáticamente
};
```

### NotificationService

#### Propósito
Gestiona notificaciones toast para feedback del usuario.

#### Uso Básico
```typescript
// Éxito
this.notificationService.showSuccess('Operación completada');

// Error
this.notificationService.showError('Error al procesar');

// Información
this.notificationService.showInfo('Información relevante');

// Warning (si está disponible)
this.notificationService.showWarning('Advertencia importante');
```

#### Patrones de Uso
```typescript
// En operaciones async
try {
  await this.customerService.createCustomer(data);
  this.notificationService.showSuccess('Cliente creado correctamente');
} catch (error) {
  this.notificationService.showError('Error al crear cliente');
}
```

### AuthService

#### Propósito
Gestiona autenticación, autorización y roles de usuario.

#### Uso Básico
```typescript
// Verificar si es usuario root
if (this.authService.isRoot()) {
  // Lógica específica para root
}

// Obtener perfil del usuario actual
const profile = this.authService.getCurrentUserProfile();
console.log('Role:', profile?.roleId);

// Verificar permisos
const canManage = profile?.roleId === 'root' || profile?.roleId === 'admin';
```

#### Uso en Templates
```typescript
// En componentes
get canViewCost(): boolean {
  const currentUser = this.authService.getCurrentUserProfile();
  return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
}
```

```html
<!-- En templates -->
@if (canViewCost) {
  <div>Información sensible</div>
}
```

---

## 🔧 Patrones de Implementación Comunes

### 1. Servicios Reactivos Multi-Tenant
```typescript
export class DataService {
  watchData(): Observable<T[]> {
    const isRoot = this.authService.isRoot();

    if (isRoot) {
      return this.rootBusinessSelector.selection$.pipe(
        switchMap(selection => {
          const businessId = selection.showAll ? null : selection.businessId;
          return businessId 
            ? this.databaseService.getWhere<T>('collection', 'businessId', '==', businessId)
            : of([]);
        })
      );
    } else {
      return from(this.businessService.getCurrentBusinessId()).pipe(
        switchMap(id => this.databaseService.getWhere<T>('collection', 'businessId', '==', id))
      );
    }
  }
}
```

### 2. Componentes con Modal Container
```typescript
export class PageComponent implements AfterViewInit {
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;

  constructor(private modalService: ModalService) {}

  ngAfterViewInit() {
    this.modalService.setModalContainer(this.modalContainer);
  }
}
```

### 3. Filtros Neutrales por Defecto
```typescript
// Configuración de filtros que muestra todo por defecto
filters: FilterInterface = {
  search: '',
  type: null,      // Todos los tipos
  active: null,    // Todos los estados  
  category: null   // Todas las categorías
};
```

### 4. Manejo de Errores Consistente
```typescript
async executeOperation(): Promise<void> {
  try {
    await this.service.operation();
    this.notificationService.showSuccess('Operación exitosa');
  } catch (error) {
    console.error('Error:', error);
    this.notificationService.showError('Error en la operación');
  }
}
```

---

## 🎨 Estilo y Diseño UI

### PageHeaderComponent - Estilo Consistente
**IMPORTANTE**: Todas las páginas principales deben usar el `PageHeaderComponent` para consistencia visual.

```typescript
// Estructura estándar para páginas principales
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';

@Component({
  imports: [CommonModule, StockinNavbarComponent, PageHeaderComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de [Módulo]"
          subtitle="Descripción del módulo y sus funcionalidades"
          [actions]="headerActions">
        </stockin-page-header>

        <!-- Contenido principal -->
        
      </main>
    </div>
  `
})
export class PageComponent {
  headerActions: PageHeaderAction[] = [
    {
      label: 'Nuevo [Elemento]',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    }
  ];
}
```

### Patrones de Títulos Estandarizados
| Página | Título | Subtítulo |
|--------|--------|-----------|
| Productos | "Gestión de Productos" | "Gestiona tu inventario, agrega nuevos productos y controla el stock" |
| Clientes | "Gestión de Clientes" | "Administra tu base de clientes y gestiona la información de contacto" |
| Órdenes | "Gestión de Órdenes" | "Administra las órdenes de venta de tu negocio" |
| Categorías | "Gestión de Categorías" | "Organiza y gestiona las categorías de productos" |
| Almacenes | "Gestión de Almacenes" | "Organiza y gestiona los almacenes de tu negocio" |
| Atributos | "Gestión de Atributos" | "Gestiona los atributos dinámicos de productos (colores, tamaños, materiales)" |

### Iconos y Colores Estándar
```typescript
// Colores por tipo de acción
const actionColors = {
  blue: 'Acciones principales (Nuevo, Editar)',
  green: 'Exportar, Confirmar, Éxito',
  red: 'Eliminar, Cancelar, Peligro',
  yellow: 'Advertencias, Pendiente',
  gray: 'Acciones secundarias',
  indigo: 'Acciones especiales',
  purple: 'Acciones premium'
};

// Iconos más utilizados
PageHeaderIcons.add       // Agregar nuevo elemento
PageHeaderIcons.edit      // Editar elemento
PageHeaderIcons.export    // Exportar datos
PageHeaderIcons.view      // Ver detalles
PageHeaderIcons.refresh   // Actualizar datos
PageHeaderIcons.filter    // Filtrar resultados
```

### Estructura HTML Base
```html
<!-- Patrón obligatorio para todas las páginas -->
<stockin-navbar></stockin-navbar>

<div class="min-h-screen bg-gray-100">
  <main class="container mx-auto px-4 py-6">
    <stockin-page-header [title]="title" [subtitle]="subtitle" [actions]="actions"></stockin-page-header>
    
    <!-- Stats Cards (opcional) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Contenido de stats -->
      </div>
    </div>
    
    <!-- Filters Section (opcional) -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <!-- Filtros -->
    </div>
    
    <!-- Content Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <!-- Contenido principal -->
    </div>
  </main>
</div>
```

### Documentación Completa
Ver `claude/ui-style-guide.md` para guía completa de implementación y mejores prácticas.

---

## 📋 Checklist para Nuevos Módulos

### Servicios de Datos
- [ ] Implementar aislamiento por `businessId`
- [ ] Usar `RootBusinessSelectorService` para usuarios root
- [ ] Implementar métodos reactivos con `switchMap`
- [ ] Manejar usuarios root y no-root apropiadamente
- [ ] Incluir validación de negocio en operaciones CRUD

### Componentes de Página
- [ ] **Usar PageHeaderComponent** para consistencia visual
- [ ] **Importar PageHeaderComponent y PageHeaderIcons**
- [ ] **Implementar headerActions** con iconos y colores estándar
- [ ] **Seguir estructura HTML base** (`min-h-screen bg-gray-100` + `<main>`)
- [ ] **Aplicar patrones de títulos** estandarizados
- [ ] Configurar `ViewContainerRef` para `ModalService`
- [ ] Implementar `ngAfterViewInit` con `setModalContainer`
- [ ] Agregar `<div #modalContainer></div>` al template
- [ ] Verificar permisos basados en roles
- [ ] Implementar filtros neutros por defecto

### Componentes de Modal
- [ ] Implementar compatibilidad dual (directo + dinámico)
- [ ] Usar `@Output() modalClosed` para binding directo
- [ ] Usar `try-catch` para `ModalService.closeModal()`
- [ ] Manejar datos de entrada apropiadamente

### Filtros y Búsqueda
- [ ] Configurar valores neutros por defecto (`null`, `''`)
- [ ] Implementar lógica condicional para valores neutros
- [ ] Proporcionar opciones "Todos" en selectores
- [ ] Hacer comportamiento evidente al usuario

### Error Handling
- [ ] Implementar try-catch en operaciones async
- [ ] Mostrar notificaciones apropiadas
- [ ] Registrar errores en console para debugging
- [ ] Manejar estados de loading y error

---

## 📘 OrderStatesService - Guía de Uso

### **IMPORTANTE: Patrón para Configuraciones Estáticas**

El `OrderStatesService` representa un **nuevo patrón arquitectónico** para manejar configuraciones estáticas sin consultas Firebase. Este patrón debe usarse para:

- ✅ Estados de órdenes
- ✅ Configuraciones de aplicación
- ✅ Catálogos estáticos (países, monedas, etc.)
- ✅ Plantillas de texto
- ✅ Opciones de negocio predefinidas

### Uso Básico

```typescript
// En ngOnInit del componente
async ngOnInit() {
  await this.orderStatesService.loadStatesConfig();
  // Resto de inicialización...
}

// Obtener estados para un plan
get orderStatuses() {
  return this.orderStatesService.getStatusOptions(this.currentBusinessPlan);
}

// Obtener transiciones válidas
getAvailableTransitions(currentStatus: string): string[] {
  return this.orderStatesService.getValidTransitions(currentStatus);
}

// Obtener etiqueta de estado
getStatusLabel(status: string): string {
  return this.orderStatesService.getStatusLabel(status);
}

// Obtener clases CSS
getStatusClasses(status: string): string {
  return this.orderStatesService.getStatusClasses(status);
}
```

### Configuración JSON

```json
// /src/assets/data/order-states.json
{
  "version": "1.0.0",
  "lastUpdated": "2025-07-20",
  "businessPlans": {
    "basic": {
      "name": "Plan Básico",
      "statuses": ["pending", "preparing", "prepared", "dispatched", "canceled", "returned", "refunded"]
    },
    "premium": {
      "name": "Plan Premium", 
      "statuses": ["pending", "preparing", "prepared", "dispatched", "canceled", "returned", "refunded", "in_delivery", "delivered"]
    },
    "enterprise": {
      "name": "Plan Enterprise",
      "statuses": ["pending", "preparing", "prepared", "dispatched", "canceled", "returned", "refunded", "in_delivery", "delivered"]
    }
  },
  "statusLabels": {
    "pending": "Pendiente",
    "preparing": "Preparando",
    "prepared": "Preparado",
    "dispatched": "Despachado",
    "canceled": "Cancelado",
    "returned": "Devuelto",
    "refunded": "Reembolsado",
    "in_delivery": "En Viaje",
    "delivered": "Entregado"
  },
  "statusColors": {
    "pending": "bg-red-50 text-red-700 border-red-200",
    "preparing": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "prepared": "bg-green-50 text-green-700 border-green-200",
    "dispatched": "bg-purple-50 text-purple-700 border-purple-200",
    "canceled": "bg-red-100 text-red-800 border-red-300",
    "returned": "bg-yellow-100 text-yellow-800 border-yellow-300",
    "refunded": "bg-orange-50 text-orange-700 border-orange-200",
    "in_delivery": "bg-blue-50 text-blue-700 border-blue-200",
    "delivered": "bg-blue-100 text-blue-800 border-blue-300"
  },
  "statusTransitions": {
    "pending": ["preparing", "canceled"],
    "preparing": ["prepared", "canceled"],
    "prepared": ["dispatched", "canceled"],
    "dispatched": ["in_delivery", "canceled", "returned"],
    "in_delivery": ["delivered", "canceled", "returned"],
    "delivered": ["returned", "refunded"],
    "canceled": [],
    "returned": ["refunded"],
    "refunded": []
  },
  "stockOperations": {
    "pending": "RESERVE",
    "preparing": "NO_CHANGE",
    "prepared": "NO_CHANGE", 
    "dispatched": "CONFIRM",
    "canceled": "RELEASE",
    "returned": "RELEASE_AND_RESTORE",
    "refunded": "NO_CHANGE",
    "in_delivery": "NO_CHANGE",
    "delivered": "NO_CHANGE"
  }
}
```

### Métodos Principales

#### `loadStatesConfig(): Promise<OrderStatesConfig>`
Carga la configuración desde el archivo JSON. Debe llamarse una vez al inicializar.

#### `getStatusOptions(plan: BusinessPlan): Array<{value: string, label: string}>`
Retorna opciones de estado formateadas para selectores.

#### `getBulkActionStatuses(plan: BusinessPlan): Array<{value: string, label: string}>`
Retorna estados disponibles para acciones masivas.

#### `getValidTransitions(status: string): string[]`
Retorna transiciones válidas desde un estado dado.

#### `getStatusLabel(status: string): string`
Retorna la etiqueta traducida de un estado.

#### `getStatusClasses(status: string): string`
Retorna las clases CSS para styling del estado.

#### `getStockOperation(status: string): StockOperation`
Retorna la operación de stock requerida para un estado.

#### `isValidTransition(fromStatus: string, toStatus: string): boolean`
Valida si una transición entre estados es permitida.

### Ventajas del Patrón JSON Estático

1. **Performance Superior**:
   - Zero consultas Firebase para configuración
   - Carga única al inicializar aplicación
   - Cache automático del navegador

2. **Mantenibilidad**:
   - Configuración centralizada en un archivo
   - Versionado y control de cambios
   - Fácil actualización sin redeploy

3. **Escalabilidad**:
   - Plan-based configuration
   - Extensible sin cambios de código
   - Backward compatible

4. **Deploy Simplificado**:
   - Assets estáticos en build
   - Sin dependencias de Firebase para configuración
   - CDN-friendly

### Cuándo Usar Este Patrón

✅ **SÍ usar para**:
- Configuraciones que no cambian frecuentemente
- Catálogos estáticos (países, estados, etc.)
- Estados de flujos de trabajo
- Plantillas y texto estático
- Opciones de negocio predefinidas

❌ **NO usar para**:
- Datos dinámicos de usuarios
- Información en tiempo real
- Datos que cambian constantemente
- Configuraciones específicas por negocio
- Datos que requieren autenticación

### Ejemplo de Implementación Completa

```typescript
// orders.page.ts
export class OrdersPage implements OnInit {
  currentBusinessPlan: BusinessPlan = 'premium';

  constructor(
    private orderStatesService: OrderStatesService
  ) {}

  async ngOnInit() {
    // Cargar configuración una sola vez
    await this.orderStatesService.loadStatesConfig();
    await this.loadOrders();
  }

  // Getters dinámicos basados en plan
  get orderStatuses() {
    return this.orderStatesService.getStatusOptions(this.currentBusinessPlan);
  }

  get bulkActionStatuses() {
    return this.orderStatesService.getBulkActionStatuses(this.currentBusinessPlan);
  }

  // Métodos helpers
  getStatusLabel(status: string): string {
    return this.orderStatesService.getStatusLabel(status);
  }

  getStatusClasses(status: string): string {
    return this.orderStatesService.getStatusClasses(status);
  }

  getAvailableTransitions(status: string): string[] {
    return this.orderStatesService.getValidTransitions(status);
  }

  canChangeStatus(order: Order, newStatus: string): boolean {
    if (!this.canManageOrders) return false;
    return this.orderStatesService.isValidTransition(order.status, newStatus);
  }
}
```

### Lecciones Aprendidas

**LO QUE NO HACER en el futuro**:
- ❌ Hardcodear configuraciones en constants
- ❌ Usar Firebase para datos estáticos
- ❌ Crear servicios de cache duplicados
- ❌ Ignorar arquitectura existente

**LO QUE SÍ HACER**:
- ✅ Evaluar si los datos pueden ser estáticos
- ✅ Usar JSON para configuraciones estáticas
- ✅ Integrar con servicios existentes
- ✅ Documentar patrones para el futuro

**Este patrón debe ser la referencia para futuras implementaciones de configuraciones estáticas.** 🎯