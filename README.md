# StockIn-Manager - Documentación de Inicialización y Arquitectura

## 🛠️ Inicialización de Firebase y Reglas

### 1. Instalación de Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login en Firebase
```bash
firebase login --no-localhost
```
Sigue el enlace que te da la terminal, inicia sesión y pega el código de autorización.

### 3. Inicialización del Proyecto Firebase
```bash
firebase init
```
- Selecciona solo los servicios que necesites (Firestore, Functions, Storage, Emulators, Remote Config)
- Asocia el proyecto con **stockin-manager**
- Usa `firestore.rules` para reglas y `firestore.indexes.json` para índices
- Usa TypeScript para Functions si lo deseas
- Instala dependencias cuando lo pida

### 4. Reglas abiertas temporales para inicialización
Crea/edita el archivo `firestore.rules`:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. Deploy de reglas
```bash
firebase deploy --only firestore:rules
```

### 6. Inicialización automática de roles y usuario root
- Al iniciar la app, se crearán los roles y el usuario root si no existen.
- Verifica en la consola del navegador los mensajes de éxito.
- Revisa tu email para el correo de verificación.

### 7. Restaurar reglas seguras después de la inicialización
**¡No olvides volver a poner reglas seguras!**

---

## 📁 Arquitectura de Carpetas (2024)

```
src/app/
├── core/                        # Servicios globales, guards, models
│   ├── services/
│   ├── guards/
│   ├── interceptors/
│   └── models/
├── shared/                      # Componentes compartidos
│   ├── components/
│   ├── directives/
│   └── pipes/
├── modules/
│   ├── stockin-manager/         # App principal de inventario
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── models/
│   │   └── config/
│   └── marketing/               # Sitio institucional
├── config/                      # Configuraciones (firebase, theme, app)
├── scripts/                     # Scripts de inicialización y utilidades
└── app.routes.ts                # Rutas principales
```

---

## 🏗️ Arquitectura del Sistema de Cache y Estados

### Sistema de Cache Existente

El proyecto utiliza una arquitectura de cache optimizada que reduce significativamente las consultas a Firebase:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Component     │    │   Service       │    │  Cache System   │
│   orders.page   │    │   OrderService  │    │    Existing     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Load states        │                       │
         │ ────────────────────▶ │                       │
         │                       │                       │
         │ 2. Cache permanent    │ ──── CacheService ───▶│
         │ ◀────────────────────│       (localStorage)   │
         │                       │                       │
         │                       │ 3. Create order       │
         │                       │ ─────────────────────▶│
         │                       │                       │
         │                       │ 4. Notify change      │
         │                       │ ──ChangeDetection────▶│
         │                       │                       │
         │ 5. Auto-invalidate    │                       │
         │    via existing rules │ ◀─CacheInvalidation───│
         │ ◀────────────────────│                       │
```

### Servicios de Cache Disponibles

#### **CacheService**
- **Propósito**: Cache multi-nivel (memory, sessionStorage, localStorage)
- **TTL automático**: Limpieza automática de cache expirado
- **Ubicación**: `src/app/core/services/cache.service.ts`
- **Uso**: `this.cacheService.set(key, data, ttl, storageType)`

#### **ChangeDetectionService**
- **Propósito**: Control inteligente de freshness y detección de cambios
- **Freshness threshold**: 10 minutos para evitar consultas innecesarias
- **Ubicación**: `src/app/core/services/change-detection.service.ts`
- **Uso**: `this.changeDetectionService.notifyChange(changeData)`

#### **CacheInvalidationService**
- **Propósito**: Invalidación automática con 7 reglas predefinidas
- **Cross-service**: OrderService invalida ProductService automáticamente
- **Ubicación**: `src/app/core/services/cache-invalidation.service.ts`
- **Reglas**: orders → products, customers, inventory

#### **OrderStatesService** (Nuevo)
- **Propósito**: Manejo de estados desde archivo JSON estático
- **Zero Firebase reads**: Estados cargan desde `/src/assets/data/order-states.json`
- **Ubicación**: `src/app/modules/stockin-manager/services/order-states.service.ts`
- **Beneficios**: Performance optimizada, configuración centralizada

### Performance Lograda
- **80-90% reducción** en Firebase reads por cache inteligente
- **Tiempo de respuesta**: < 50ms para datos cacheados
- **Estados permanentes**: Sin consultas Firebase para configuración

### Estados Plan-Based Implementados

#### **Planes de Negocio Soportados:**
- **Basic**: 7 estados (pending → dispatched → refunded)
- **Premium**: 9 estados (Basic + in_delivery, delivered)
- **Enterprise**: 9 estados + tracking de usuarios automático

#### **Gestión de Stock por Estado:**
- `pending`: RESERVE (reserva stock)
- `dispatched`: CONFIRM (confirma venta, descuenta stock)
- `canceled`: RELEASE (libera reservas)
- `returned`: RELEASE_AND_RESTORE (libera y restaura stock)

---

# Spa

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
