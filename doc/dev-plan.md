# Plan de Desarrollo del Módulo stockIn-manager
## Gestión de Inventario por SKU - Aplicación SaaS Multi-Tenant

### 📋 Índice
1. [Introducción y Contexto](#introducción-y-contexto)
2. [Arquitectura Tecnológica y Servicios Comunes](#arquitectura-tecnológica-y-servicios-comunes)
3. [Modelo de Datos y Gestión de Roles](#modelo-de-datos-y-gestión-de-roles)
4. [Plan de Desarrollo por Fases](#plan-de-desarrollo-por-fases)
5. [Integraciones Modernas](#integraciones-modernas)
6. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
7. [Roadmap y Conclusión](#roadmap-y-conclusión)

---

## 🎯 Introducción y Contexto

### Visión General del Proyecto
**stockIn-manager** será un módulo especializado dentro de un proyecto Angular existente (desplegado en Vercel) para la gestión integral de inventario mediante códigos SKU. Se desarrollará como una **aplicación SaaS multi-tenant** que permitirá a múltiples negocios gestionar su inventario de forma independiente y segura.

### Arquitectura de Roles
- **Super-Admin**: Control total de la plataforma, gestión de negocios y usuarios
- **Admin**: Gestión completa del negocio individual
- **Editor**: Permisos sobre inventario, sin gestión de usuarios
- **Vendedor/Operador**: Enfocado en pedidos y operaciones diarias

#### Sistema de Roles Normalizado
Los usuarios referencian roles mediante `roleId`, eliminando duplicación de permisos:
- **Relación**: `users.roleId` → `roles.id`
- **Beneficios**: Cambios globales de permisos, consistencia de datos, roles personalizables
- **Permisos**: Definidos únicamente en la colección `roles`

### Objetivos Principales
1. **Gestión centralizada de SKUs** con ubicaciones multi-almacén
2. **Control de stock en tiempo real** con alertas automatizadas
3. **Integración futura** con MercadoLibre y Tiendanube
4. **Dashboard inteligente** con métricas y reportes
5. **Trazabilidad completa** mediante app móvil Flutter
6. **Escalabilidad** para múltiples clientes

---

## 🏗️ Arquitectura Tecnológica y Servicios Comunes

### Stack Tecnológico Principal
- **Frontend**: Angular + AngularFire
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Deployment**: Vercel
- **Mobile**: Flutter (fase futura)

### Servicios Comunes Angular

#### 1. AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Gestión de autenticación Firebase
  // Control de sesiones y roles
  // Verificación de permisos
}
```

#### 2. DatabaseService
```typescript
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  // Operaciones CRUD con Firestore
  // Queries en tiempo real
  // Manejo de transacciones
}
```

#### 3. StorageService
```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  // Gestión de imágenes de productos
  // Upload/download de archivos
  // Gestión de URLs seguras
}
```

#### 4. PdfService
```typescript
@Injectable({ providedIn: 'root' })
export class PdfService {
  // Generación de etiquetas SKU
  // Impresión de pedidos
  // Reportes en PDF
}
```

#### 5. LoggingService
```typescript
@Injectable({ providedIn: 'root' })
export class LoggingService {
  // Auditoría centralizada
  // Registro de eventos críticos
  // Historial de cambios
}
```

#### 6. NotificationService
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Alertas de stock bajo
  // Notificaciones en tiempo real
  // Email/SMS automatizados
}
```

---

## 📊 Modelo de Datos y Gestión de Roles

### Estructura de Colecciones Firestore

#### 🏢 Colección `businesses`
```json
{
  "id": "business_id",
  "name": "Nombre del Negocio",
  "email": "contact@business.com",
  "phone": "+54911234567",
  "address": "Dirección física",
  "plan": "basic|premium|enterprise",
  "createdAt": "timestamp",
  "isActive": true,
  "settings": {
    "currency": "ARS",
    "timezone": "America/Argentina/Buenos_Aires",
    "lowStockThreshold": 5
  }
}
```

#### 👥 Colección `users`
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "businessId": "business_id",
  "roleId": "admin",
  "isActive": true,
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

#### 🔐 Colección `roles`
```json
{
  "id": "admin",
  "name": "Administrador",
  "permissions": {
    "manage_users": true,
    "manage_inventory": true,
    "manage_orders": true,
    "view_reports": true,
    "manage_integrations": true,
    "manage_business": true
  }
}

{
  "id": "editor",
  "name": "Editor de Inventario",
  "permissions": {
    "manage_users": false,
    "manage_inventory": true,
    "manage_orders": true,
    "view_reports": true,
    "manage_integrations": false,
    "manage_business": false
  }
}

{
  "id": "vendedor",
  "name": "Vendedor/Operador",
  "permissions": {
    "manage_users": false,
    "manage_inventory": false,
    "manage_orders": true,
    "view_reports": false,
    "manage_integrations": false,
    "manage_business": false
  }
}

{
  "id": "super-admin",
  "name": "Super Administrador",
  "permissions": {
    "manage_users": true,
    "manage_inventory": true,
    "manage_orders": true,
    "view_reports": true,
    "manage_integrations": true,
    "manage_business": true,
    "manage_tenants": true,
    "manage_platform": true
  }
}
```

#### 📦 Colección `skus`
```json
{
  "id": "sku_id",
  "businessId": "business_id",
  "code": "GAL-A1-BLANCO-001",
  "name": "Producto Premium",
  "description": "Descripción detallada",
  "category": "categoria_id",
  "attributes": {
    "color": "Blanco",
    "size": "L",
    "material": "Algodón"
  },
  "location": {
    "warehouseId": "warehouse_id",
    "sector": "A1",
    "position": "Estante 3"
  },
  "stock": {
    "current": 50,
    "minimum": 10,
    "reserved": 5
  },
  "pricing": {
    "cost": 1000,
    "price": 1500
  },
  "imageUrl": "https://storage.url/image.jpg",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### 🏬 Colección `warehouses`
```json
{
  "id": "warehouse_id",
  "businessId": "business_id",
  "name": "Depósito Central",
  "code": "DEP01",
  "address": "Dirección del depósito",
  "manager": "manager_id",
  "isActive": true
}
```

#### 📋 Colección `orders`
```json
{
  "id": "order_id",
  "businessId": "business_id",
  "orderNumber": "ORD-2025-001",
  "source": "manual|mercadolibre|tiendanube",
  "customer": {
    "name": "Cliente",
    "email": "cliente@email.com",
    "phone": "+54911234567"
  },
  "items": [
    {
      "skuId": "sku_id",
      "quantity": 2,
      "price": 1500
    }
  ],
  "status": "pending|preparing|shipped|delivered|cancelled",
  "total": 3000,
  "createdAt": "timestamp",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "timestamp",
      "userId": "user_id"
    }
  ]
}
```

#### 📈 Colección `logs`
```json
{
  "id": "log_id",
  "businessId": "business_id",
  "userId": "user_id",
  "action": "stock_update|order_created|sku_created",
  "entity": "sku|order|user",
  "entityId": "entity_id",
  "details": {
    "before": "valor_anterior",
    "after": "valor_nuevo"
  },
  "timestamp": "timestamp"
}
```

---

## 🚀 Plan de Desarrollo por Fases

### 📅 Fase 1: Configuración Inicial y Autenticación (Semanas 1-2)

#### Objetivos
Establecer las bases sólidas del sistema con autenticación, autorización y gestión básica de usuarios.

#### Entregables
1. **Setup del Módulo Angular**
   - Configuración de `stockin-manager` module
   - Routing y lazy loading
   - Integración con AngularFire

2. **Sistema de Autenticación**
   - Login con Firebase Auth
   - Gestión de sesiones
   - Recuperación de contraseñas

3. **Control de Acceso (RBAC)**
   - Guards para protección de rutas
   - Directivas de permisos
   - Menú dinámico según rol

4. **Gestión de Usuarios (Super-Admin)**
   - CRUD de negocios
   - CRUD de usuarios
   - Asignación de roles

#### Validación de Usuario
- [ ] Login exitoso con diferentes roles
- [ ] Menú muestra opciones según permisos
- [ ] Super-admin puede crear negocios y usuarios
- [ ] Rutas protegidas funcionan correctamente

---

### 📦 Fase 2: Módulo de Inventario y Stock Multi-Almacén (Semanas 3-5)

#### Objetivos
Implementar el núcleo del sistema: gestión de productos SKU y control de stock distribuido.

#### Entregables
1. **CRUD de SKUs**
   - Listado con filtros y búsqueda
   - Formulario de creación/edición
   - Generación automática de códigos SKU
   - Validaciones de negocio

2. **Gestión de Almacenes**
   - CRUD de almacenes
   - Asignación de ubicaciones a SKUs
   - Vista de distribución de stock



4. **Gestión de Imágenes**
   - Upload a Firebase Storage
   - Compresión automática
   - Galerías de productos

#### Alertas Automatizadas
Los sistemas modernos de inventario incluyen alertas automáticas por stock bajo, notificaciones por email/SMS cuando se alcanzan umbrales críticos, y monitoreo continuo para evitar stockouts.

#### Validación de Usuario
- [ ] Crear productos con atributos y ubicaciones
- [ ] Ajustar stock y ver movimientos
- [ ] Recibir alertas de stock bajo
- [ ] Buscar y filtrar productos eficientemente
- [ ] Gestionar múltiples almacenes

---

### 📊 Fase 3: Gestión de Pedidos y Dashboard (Semanas 6-8)

#### Objetivos
Introducir gestión de ventas y métricas operativas en tiempo real.

#### Entregables
1. **Módulo de Pedidos**
   - Entrada/salida manual de stock
   - Registro de movimientos
   - Listado con filtros avanzados
   - Detalle completo de pedidos
   - Cambio de estados
   - Creación manual de pedidos
   - Alertas de stock mínimo
   - Stock reservado vs disponible

2**Impresión de Pedidos**
  - Generación de PDF
  - Hojas de picking
  - Etiquetas de envío
  - Códigos QR para tracking

3**Dashboard Inteligente**
   - Resumen del día (pedidos, ventas)
   - Top 10 productos con stock bajo
   - Productos más vendidos
   - Métricas por almacén
   - Gráficos en tiempo real

4. **Actualizaciones en Tiempo Real**
   - WebSockets con Firestore
   - Notificaciones push
   - Sincronización automática

#### Validación de Usuario
- [ ] Crear pedidos manualmente
- [ ] Cambiar estados de pedidos
- [ ] Imprimir documentos de pedidos
- [ ] Ver métricas actualizadas en tiempo real
- [ ] Dashboard responde a cambios inmediatamente

---

### 📈 Fase 4: Reportes y Auditoría Avanzada (Semanas 9-10)

#### Objetivos
Proporcionar herramientas de análisis, exportación y trazabilidad completa.

#### Entregables
1. **Sistema de Reportes**
   - Reporte de stock general
   - Movimientos por período
   - Ventas por producto/período
   - Pedidos pendientes
   - Exportación CSV/PDF/Excel

2. **Historial de Auditoría**
   - Logs detallados por SKU
   - Historial de cambios de pedidos
   - Timeline de eventos
   - Filtros avanzados

3. **Análisis Avanzado**
   - Proyección de agotamiento
   - Tendencias de ventas
   - Rotación de inventario
   - Análisis ABC de productos

4. **Notificaciones Mejoradas**
   - Emails automatizados
   - Notificaciones en app
   - Configuración personalizada

#### Validación de Usuario
- [ ] Generar reportes personalizados
- [ ] Exportar datos en múltiples formatos
- [ ] Revisar historial completo de cambios
- [ ] Configurar alertas personalizadas
- [ ] Analizar tendencias de inventario

---

### 🔗 Fase 5: Integraciones Externas y Mobile (Semanas 11-14)

#### Objetivos
Conectar con plataformas de e-commerce y desarrollar capacidades móviles para logística.

#### Entregables

#### 🛒 Integración MercadoLibre
MercadoLibre ha introducido MCP (Model Context Protocol) para agilizar integraciones mediante instrucciones en lenguaje natural, reduciendo drásticamente el tiempo de integración de APIs.

```typescript
// Cloud Function para webhook MercadoLibre
export const mercadoLibreWebhook = functions.https.onRequest(async (req, res) => {
  // Procesar notificaciones de nuevos pedidos
  // Sincronizar stock automáticamente
  // Crear pedidos en stockIn-manager
});
```

#### 🛍️ Integración Tiendanube
La API de Tiendanube usa OAuth2 para autenticación, con tokens que no expiran y soporte completo para gestión de productos y pedidos.

```typescript
// Servicio para Tiendanube API
@Injectable()
export class TiendanubeService {
  async getOrders(storeId: string, accessToken: string) {
    // Obtener pedidos de Tiendanube
  }
  
  async updateStock(productId: string, stock: number) {
    // Sincronizar stock hacia Tiendanube
  }
}
```

#### 📱 App Flutter para Logística
- Scanner de códigos QR/barcode
- Tracking de ubicación de productos
- Actualización de estados en tiempo real
- Interfaz optimizada para almacén

#### 🔄 Funcionalidades Avanzadas
- Webhooks para sincronización automática
- API REST para integraciones personalizadas
- Sistema de notificaciones push
- Análisis predictivo con ML

#### Validación de Usuario
- [ ] Recibir pedidos automáticamente de ML/Tiendanube
- [ ] Sincronizar stock bidireccionalmente
- [ ] Escanear productos con app móvil
- [ ] Trackear productos en tiempo real
- [ ] Configurar webhooks personalizados

---

## 🔐 Consideraciones de Seguridad

### Reglas de Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reglas para multi-tenancy
    match /businesses/{businessId} {
      allow read, write: if isBusinessOwner(businessId) || isSuperAdmin();
    }
    
    match /users/{userId} {
      allow read, write: if isOwnerOrAdmin(userId) || isSuperAdmin();
    }
    
    match /roles/{roleId} {
      allow read: if request.auth != null;
      allow write: if isSuperAdmin();
    }
    
    match /skus/{skuId} {
      allow read, write: if hasPermissionInRole('manage_inventory') 
        && belongsToUserBusiness(resource.data.businessId);
    }
    
    match /orders/{orderId} {
      allow read, write: if hasPermissionInRole('manage_orders')
        && belongsToUserBusiness(resource.data.businessId);
    }
    
    // Funciones helper
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roleId;
    }
    
    function getRolePermissions(roleId) {
      return get(/databases/$(database)/documents/roles/$(roleId)).data.permissions;
    }
    
    function hasPermissionInRole(permission) {
      let userRole = getUserRole();
      let permissions = getRolePermissions(userRole);
      return permissions[permission] == true;
    }
    
    function isSuperAdmin() {
      return getUserRole() == 'super-admin';
    }
    
    function belongsToUserBusiness(businessId) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.businessId == businessId;
    }
  }
}
```

### Validaciones de Seguridad
- **Autenticación**: Firebase Auth con verificación de email
- **Autorización**: RBAC granular por acción
- **Aislamiento**: Datos por businessId con reglas estrictas
- **API Keys**: Gestión segura de tokens OAuth
- **Auditoría**: Logs completos de acciones críticas

---

## 🗺️ Roadmap y Tecnologías Futuras

### Integraciones Modernas

#### Model Context Protocol (MCP)
MCP es un estándar abierto desarrollado por Anthropic que actúa como conector universal para AI, permitiendo descubrimiento dinámico de herramientas y estandarización de integraciones.

**Implementación Futura:**
```typescript
// MCP Server para stockIn-manager
class StockManagerMCPServer {
  async getTools() {
    return [
      {
        name: "check_stock",
        description: "Verificar stock de producto por SKU",
        inputSchema: { type: "object", properties: { sku: { type: "string" } } }
      },
      {
        name: "create_order",
        description: "Crear pedido automáticamente",
        inputSchema: { /* schema de pedido */ }
      }
    ];
  }
}
```

### Funcionalidades Avanzadas Planificadas

#### 🤖 IA y Machine Learning
- **Predicción de demanda** basada en históricos
- **Optimización automática** de ubicaciones
- **Detección de patrones** de ventas
- **Sugerencias inteligentes** de reposición

#### 📊 Business Intelligence
- **Dashboards ejecutivos** con KPIs avanzados
- **Análisis predictivo** de rotación
- **Comparativas** con benchmarks del sector
- **Alertas inteligentes** basadas en tendencias

#### 🌐 Expansión Multi-región
- **Soporte multi-moneda** con conversiones automáticas
- **Idiomas adicionales** (i18n completo)
- **Cumplimiento normativo** por región
- **Integración con proveedores locales**

#### 🔌 Marketplace de Integraciones
- **Plugin ecosystem** para extensiones
- **API marketplace** para conectores
- **Templates predefinidos** por industria
- **Community contributions**

---

## 📋 Checklist de Validación por Fase

### ✅ Criterios de Aceptación Generales

#### Fase 1 - Fundaciones
- [ ] Usuario puede hacer login/logout
- [ ] Roles restringen acceso correctamente
- [ ] Super-admin gestiona negocios
- [ ] Menú dinámico funciona
- [ ] Todas las rutas están protegidas

#### Fase 2 - Inventario Core
- [ ] CRUD completo de productos
- [ ] Stock se actualiza en tiempo real
- [ ] Alertas de stock bajo funcionan
- [ ] Múltiples almacenes soportados
- [ ] Búsqueda y filtros eficientes

#### Fase 3 - Ventas y Analytics
- [ ] Pedidos se gestionan completamente
- [ ] Dashboard muestra métricas correctas
- [ ] Impresión de documentos funciona
- [ ] Estados de pedidos se trackean
- [ ] Tiempo real en todas las vistas

#### Fase 4 - Reportes y Auditoría
- [ ] Reportes se generan correctamente
- [ ] Exportación en múltiples formatos
- [ ] Historial de cambios completo
- [ ] Análisis avanzados precisos
- [ ] Configuración de alertas flexible

#### Fase 5 - Integraciones
- [ ] MercadoLibre conecta automáticamente
- [ ] Tiendanube sincroniza stock
- [ ] App móvil escanea y actualiza
- [ ] Webhooks responden correctamente
- [ ] APIs externas funcionan establemente

---

## 🎯 Métricas de Éxito

### KPIs Técnicos
- **Performance**: Tiempo de carga < 2 segundos
- **Disponibilidad**: 99.9% uptime
- **Precisión**: 99.95% exactitud en stock
- **Tiempo real**: Updates < 500ms

### KPIs de Negocio
- **Adopción**: 80% de usuarios activos semanalmente
- **Eficiencia**: 50% reducción en tiempo de gestión
- **Satisfacción**: NPS > 50
- **Crecimiento**: 10+ negocios en 6 meses

---

## 📚 Recursos y Referencias

### Documentación Técnica
- [Firebase Documentation](https://firebase.google.com/docs)
- [Angular Guide](https://angular.io/guide)
- [MercadoLibre API](https://developers.mercadolibre.com)
- [Tiendanube API](https://tiendanube.github.io/api-documentation)

### Best Practices Implementadas
Implementación de cycle counting, alertas de stock mínimo, análisis ABC de inventario, y gestión multi-almacén basada en mejores prácticas de la industria.

### Tecnologías Emergentes
Model Context Protocol como estándar futuro para integraciones AI, permitiendo conectividad universal entre sistemas.

---

## 🚀 Próximos Pasos

### Inmediatos (Próximas 2 semanas)
1. **Setup del proyecto** y configuración de Firebase
2. **Definición de arquitectura** de componentes Angular
3. **Creación de servicios base** y guards de autenticación
4. **Diseño de schemas** Firestore y reglas de seguridad

### Mediano Plazo (1-3 meses)
1. **Desarrollo de Fases 1-3** con validaciones continuas
2. **Testing exhaustivo** de funcionalidades core
3. **Optimización de performance** y UX
4. **Preparación para integraciones** externas

### Largo Plazo (3-6 meses)
1. **Integraciones ML/Tiendanube** completamente funcionales
2. **App móvil Flutter** en producción
3. **Análisis IA** y predicciones implementadas
4. **Escalamiento** a múltiples clientes

---

**🎉 ¡Listo para revolucionar la gestión de inventarios!**

Este plan evolutivo asegura entregas incrementales de valor, validación continua con usuarios reales, y preparación para el crecimiento futuro. Cada fase construye sobre la anterior, manteniendo la calidad y escalabilidad del sistema.

**Fecha de creación**: Julio 2025  
**Versión**: 1.0  
**Próxima revisión**: Quincenal durante desarrollo activo
