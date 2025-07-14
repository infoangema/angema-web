## Análisis para economizar llamados a firebase.

Necesitamos analizar todo el proyecto y generar una estrategia para ahorrar llamados inecesarios a firebase y no generar facturaciones tan altas.
dejo algunas propuestas y quiero que las analices y luego descargues todo tu analisis en este mismo archivo.

Estrategias a tener en cuenta:

- Guardar luego del primer llamado a cada coleccion, los datos en el browser con alguna estrategia. LocalStorage, SessionStorage o extensionStorage. Si hay alguna otra estrategia, plantearla.
- Al detectar un cambio, como nueva orden de compra, edicion de un cliente, edicion de un producto etc. avisar por medio de un servicio, flag en el storage o alguna coleccion dedicada a esto que se deben realizar los llamados a cada coleccion a medida que se requieran y actualizar los datos locales.
- verificar alguna estrategia para que el sistema autodetecte si el plan que tiene el negocio es de tipo "basic" solo se pueda abrir una instancia de el, para no gastar en llamados inecesarios. Por ejemplo, saber si hay alguna funcion de firebase para saber cuantas conexiones hay al mismo tiempo y no permitir la carga de esa sesion.

Estas son algunas cosas que se me ocurren, pero es la primera que tengo que resolver un problema de este tipo.
Quiero que analices todo el proyecto, especialmente los servicios con los llamados a las coleccciones y los componentes que muestran los datos y propongas tu solucion.

---

# ANÁLISIS Y ESTRATEGIAS DE OPTIMIZACIÓN FIREBASE

## 1. SITUACIÓN ACTUAL

### Servicios identificados con llamados a Firebase:
- **DatabaseService** (`/src/app/core/services/database.service.ts`): Servicio principal que maneja todas las operaciones CRUD
- **CustomerService** (`/src/app/modules/stockin-manager/services/customer.service.ts`): Gestión de clientes
- **ProductService** (`/src/app/modules/stockin-manager/services/product.service.ts`): Gestión de productos
- **BusinessService** (`/src/app/core/services/business.service.ts`): Gestión de negocios y usuarios

### Patrones problemáticos identificados:

#### 1.1 Uso excesivo de `onSnapshot` (listeners en tiempo real)
- **CustomerService.watchCustomers()**: Usa listeners en tiempo real que consumen continuamente reads
- **DatabaseService.getAll()**: Implementa listeners automáticos para todas las colecciones
- **DatabaseService.getWhere()**: Listeners con filtros que se ejecutan constantemente

#### 1.2 Consultas redundantes
- **CustomerService**: Múltiples llamados al obtener businessId en cada operación
- **ProductService**: Consultas repetitivas sin cache local
- **BusinessService**: Llamados duplicados para obtener el mismo business

#### 1.3 Falta de cache local
- No existe implementación de cache a pesar de tener LocalStorageService y SessionStorageService
- Los datos se consultan desde Firebase en cada carga de componente

#### 1.4 Componentes que realizan múltiples subscriptions
- **CustomersListComponent**: Se subscribe a `watchCustomers()` que mantiene listener activo
- Cada componente crea su propia subscription sin reutilizar datos

## 2. IMPACTO EN COSTOS

### Lecturas principales identificadas:
- **onSnapshot listeners**: Cuentan como 1 read por documento cada vez que cambia
- **getOnce calls**: 1 read por documento consultado
- **Queries con filtros**: 1 read por documento que cumple el criterio
- **Consultas de validación**: `isCodeUnique`, `exists` generan reads adicionales

### Estimación actual (por sesión de usuario):
- Carga inicial: ~50-100 reads (customers, products, business data)
- Listeners activos: ~20-50 reads por cambio en BD
- Validaciones: ~10-30 reads por operación CRUD
- **Total estimado**: 100-200 reads por sesión activa

## 3. ESTRATEGIAS DE OPTIMIZACIÓN PROPUESTAS

### 3.1 Implementación de Cache Inteligente

#### A) Cache Service Centralizado
```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos
  
  // Cache con TTL automático
  set(key: string, data: any, ttl?: number): void
  get(key: string): any | null
  invalidate(pattern: string): void
  
  // Cache persistente con localStorage
  setPersistent(key: string, data: any): void
  getPersistent(key: string): any | null
}
```

#### B) Estrategia de Cache por Colección
- **Customers**: Cache en localStorage (persistente entre sesiones)
- **Products**: Cache en sessionStorage (válido por sesión)
- **Business data**: Cache en memoria (datos estáticos)

### 3.2 Sistema de Invalidación Inteligente

#### A) Change Detection Service
```typescript
@Injectable({ providedIn: 'root' })
export class ChangeDetectionService {
  private lastUpdateTimestamps = new Map<string, number>();
  
  // Verificar si los datos locales están obsoletos
  needsRefresh(collection: string): boolean
  
  // Marcar colección como actualizada
  markAsUpdated(collection: string): void
  
  // Invalidar cache específico
  invalidateCollection(collection: string): void
}
```

#### B) Eventos de Invalidación
- Crear/Editar/Eliminar cliente → Invalidar cache de customers
- Operaciones de productos → Invalidar cache de products
- Cambios de negocio → Invalidar todos los caches relacionados

### 3.3 Optimización de Consultas

#### A) Lazy Loading Inteligente
```typescript
// En lugar de cargar todos los customers
watchCustomers(): Observable<Customer[]> {
  // Primero verificar cache
  const cached = this.cacheService.get('customers_' + businessId);
  if (cached && !this.changeDetection.needsRefresh('customers')) {
    return of(cached);
  }
  
  // Solo si es necesario, consultar Firebase
  return this.databaseService.getOnce('customers', constraints)
    .pipe(
      tap(data => this.cacheService.set('customers_' + businessId, data))
    );
}
```

#### B) Eliminación de Listeners Innecesarios
- Reemplazar `onSnapshot` por `getOnce` + cache inteligente
- Implementar refresh manual/automático con intervalos
- Usar listeners solo para datos críticos en tiempo real

### 3.4 Optimización de Validaciones

#### A) Cache de Validaciones
```typescript
// Cache temporal para validaciones recientes
private validationCache = new Map<string, boolean>();

async isCodeUnique(code: string): Promise<boolean> {
  const cacheKey = `unique_${code}_${businessId}`;
  
  if (this.validationCache.has(cacheKey)) {
    return this.validationCache.get(cacheKey)!;
  }
  
  // Solo consultar si no está en cache
  const result = await this.validateInFirebase(code);
  this.validationCache.set(cacheKey, result);
  
  return result;
}
```

### 3.5 Gestión de Conexiones Concurrentes

#### A) Session Management Service
```typescript
@Injectable({ providedIn: 'root' })
export class SessionManagementService {
  private readonly MAX_BASIC_SESSIONS = 1;
  
  async checkSessionLimit(plan: string): Promise<boolean> {
    if (plan === 'basic') {
      const activeSessions = await this.getActiveSessionsCount();
      return activeSessions < this.MAX_BASIC_SESSIONS;
    }
    return true;
  }
  
  async registerSession(): Promise<void>
  async closeSession(): Promise<void>
}
```

#### B) Implementación de Control de Acceso
- Verificar plan del negocio al login
- Mantener registro de sesiones activas en Firestore
- Denegar acceso si se excede el límite para plan básico

## 4. PLAN DE IMPLEMENTACIÓN

### Fase 0: Configuración Realtime Database (INMEDIATO)
1. **Crear Realtime Database en Firebase Console**
   - Nombre sugerido: `angema-sessions-rtdb` 
   - Región: misma que Firestore (us-central1 recomendado)
   - Modo: Locked mode (configuraremos reglas después)

2. **Configurar reglas de seguridad**
```json
{
  "rules": {
    "sessions": {
      "$businessId": {
        "$userId": {
          ".write": "$userId == auth.uid",
          ".read": "$userId == auth.uid"
        }
      }
    },
    "business_sessions_count": {
      "$businessId": {
        ".read": true,
        ".write": false
      }
    }
  }
}
```

3. **Estructura de datos inicial**
```json
{
  "sessions": {
    "business_123": {
      "user_456": {
        "timestamp": 1703123456789,
        "plan": "basic",
        "sessionId": "sess_abc123",
        "userAgent": "Chrome/120.0",
        "ip": "192.168.1.1"
      }
    }
  },
  "business_sessions_count": {
    "business_123": {
      "active_count": 1,
      "last_updated": 1703123456789
    }
  }
}
```

4. **Datos necesarios para configuración**
   - URL de la Realtime Database (te la dará Firebase Console)
   - Misma configuración de autenticación que Firestore
   - Agregar URL al firebase.config.ts

### Fase 1: Implementación Control de Sesiones (Semana 1) ✅ COMPLETADA
1. ✅ Crear SessionControlService con Realtime Database
2. ✅ Implementar detección de sesiones activas por plan
3. ✅ Integrar verificación en AuthGuard
4. ✅ Crear UI para mostrar "Sesión ya activa en otro dispositivo"

### Fase 2: Cache Básico (Semana 2) ✅ COMPLETADA
1. ✅ Crear CacheService y ChangeDetectionService
2. ✅ Implementar cache en CustomerService
3. ✅ Eliminar listeners innecesarios en CustomersListComponent

### Fase 3: Optimización de Consultas (Semana 3) ✅ COMPLETADA
1. ✅ Implementar lazy loading en ProductService
2. ✅ Optimizar BusinessService con cache
3. ✅ Crear sistema de invalidación por eventos

### Fase 4: Monitoreo y Ajustes (Semana 4) ✅ COMPLETADA - menu que solo deberia ver el usuario Root
0. ✅ crear acceso en el router y el navbar a la funcionalidad
1. ✅ Implementar métricas de uso de Firebase y sesiones activas
2. ✅ Dashboard de control de sesiones por negocio y plan
3. ✅ Ajustar TTL de cache según patrones de uso
4. ✅ Optimizar consultas adicionales identificadas

## 5. RESULTADOS ESPERADOS

### Reducción estimada de reads:
- **Cache inicial**: -70% en cargas subsecuentes
- **Eliminación de listeners**: -80% en reads por cambios
- **Validaciones optimizadas**: -90% en validaciones repetidas
- **Consultas agrupadas**: -60% en consultas redundantes

### Total estimado: **Reducción del 75-85% en llamados a Firebase**

### Beneficios adicionales:
- Mejor rendimiento de la aplicación
- Experiencia de usuario más fluida
- Menor dependencia de conectividad
- Control granular sobre el uso de recursos

## 6. CONSIDERACIONES TÉCNICAS

### Limitaciones identificadas:
- **Firebase Firestore**: No tiene límites de conexiones concurrentes (a diferencia de Realtime Database)
- **Plan básico**: El límite de conexiones concurrentes no aplica directamente a Firestore
- **Costo principal**: Son las lecturas (reads), no las conexiones

### Recomendaciones adicionales:
- Migrar datos estáticos a archivos JSON locales
- Implementar paginación real (no solo client-side)
- Considerar usar Firestore offline persistence
- Evaluar usar Firebase Functions para operaciones complejas

Este análisis proporciona una hoja de ruta clara para reducir significativamente los costos de Firebase manteniendo la funcionalidad y mejorando el rendimiento.
