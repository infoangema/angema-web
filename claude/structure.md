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

#### CustomerService
- **Propósito**: Gestión completa de clientes/CRM
- **Funcionalidades**: CRUD clientes, búsqueda, filtros, exportación CSV
- **Features**: Puntos de fidelización, segmentación, historial de compras
- **Business Logic**: Aislamiento por negocio, códigos únicos de cliente

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

### Firestore Optimizations
- **Client-side Filtering**: Para evitar índices complejos
- **Pagination**: Carga incremental de datos
- **Real-time Subscriptions**: Solo donde es necesario

### UI/UX Optimizations
- **Responsive Design**: Mobile-first approach
- **Loading States**: Spinners y skeleton screens
- **Error Handling**: Notificaciones user-friendly

---

## 📖 Guías de Uso de Servicios

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

## 📋 Checklist para Nuevos Módulos

### Servicios de Datos
- [ ] Implementar aislamiento por `businessId`
- [ ] Usar `RootBusinessSelectorService` para usuarios root
- [ ] Implementar métodos reactivos con `switchMap`
- [ ] Manejar usuarios root y no-root apropiadamente
- [ ] Incluir validación de negocio en operaciones CRUD

### Componentes de Página
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