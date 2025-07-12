# Registro de Errores y Soluciones - Angema Web

## Propósito de este Archivo

Este documento mantiene un registro detallado de todos los errores encontrados durante el desarrollo del proyecto y sus soluciones correspondientes. Es fundamental para el contexto de desarrollo con IA, ya que proporciona información valiosa sobre problemas recurrentes y patrones de solución.

---

## 🐛 Errores Resueltos

### Error #1: Firestore Tracking Expressions y Duplicate Keys
**Fecha**: Enero 2025  
**Versión**: v.0.5.4  
**Severidad**: Alta  

#### Descripción del Problema
Al intentar actualizar precios de productos, aparecían múltiples errores en consola:
- `NG6055: The provided track expression resulted in duplicated keys`
- `Error updating document: FirebaseError: Invalid document reference`
- `Error updating product: FirebaseError: Invalid document reference`

#### Síntomas Observados
1. Modal de edición de productos fallaba al guardar cambios
2. Lista de productos mostraba elementos duplicados
3. Angular no podía trackear elementos en `@for` loops
4. Errores de referencia de documento inválida en Firestore

#### Causa Raíz
1. **Consultas Complejas de Firestore**: Las consultas con múltiples `where()` y `orderBy()` estaban devolviendo documentos duplicados
2. **Array con IDs Duplicados**: El array `products` en el componente contenía elementos con IDs duplicados
3. **Tracking Expressions**: Angular no podía manejar los duplicados en los nuevos `@for` loops

#### Solución Implementada

##### 1. DatabaseService - Filtro de Duplicados
```typescript
// En método query() y getOnce()
const seen = new Set<string>();
items = items.filter(item => {
  const itemId = (item as any).id;
  if (seen.has(itemId)) {
    return false;
  }
  seen.add(itemId);
  return true;
});
```

##### 2. ProductService - Consultas Simplificadas
```typescript
// Antes: Consulta compleja
getProductsByBusiness(businessId: string, orderBy: string, direction: any): Observable<SKU[]> {
  return this.databaseService.getWhere<SKU>('products', 'businessId', '==', businessId, orderBy, direction);
}

// Después: Consulta simple + filtrado cliente
getProductsByBusiness(businessId: string): Observable<SKU[]> {
  return this.databaseService.getWhere<SKU>('products', 'businessId', '==', businessId)
    .pipe(
      map(products => products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
    );
}
```

##### 3. ProductsListComponent - Prevención de Duplicados
```typescript
// Verificación antes de agregar productos
const newUniqueProducts = moreProducts.filter(newProduct => 
  !this.products.some(existingProduct => existingProduct.id === newProduct.id)
);
this.products = [...this.products, ...newUniqueProducts];
```

#### Archivos Modificados
- `src/app/core/services/database.service.ts` - Filtros de duplicados
- `src/app/modules/stockin-manager/services/product.service.ts` - Consultas simplificadas  
- `src/app/modules/stockin-manager/pages/products/products-list/products-list.component.ts` - Prevención duplicados

#### Resultado
✅ Eliminados errores de tracking  
✅ Actualizaciones de productos funcionan correctamente  
✅ Sin duplicados en listas de productos  
✅ Referencias de documento válidas en todas las operaciones  

---

### Error #2: TypeScript Property 'id' does not exist on type 'T'
**Fecha**: Enero 2025  
**Versión**: v.0.5.4  
**Severidad**: Media  

#### Descripción del Problema
Después de implementar los filtros de duplicados, aparecían errores de TypeScript:
- `TS2339: Property 'id' does not exist on type 'T'`
- `TS4111: Property 'id' comes from an index signature, so it must be accessed with ['id']`

#### Causa Raíz
TypeScript no puede inferir que el tipo genérico `T` tenga la propiedad `id`, ya que no existe una constraint que lo garantice.

#### Solución Implementada
```typescript
// Uso de type assertion para acceso seguro
const itemId = (item as any).id;
const docId = (doc as any).id;
```

#### Archivos Modificados
- `src/app/core/services/database.service.ts` - Type assertions para acceso a `id`

#### Resultado
✅ Build exitoso sin errores de TypeScript  
✅ Acceso seguro a propiedades de documentos  

---

### Error #3: CreateProductModalComponent Sintaxis Deprecada
**Fecha**: Enero 2025  
**Versión**: v.0.5.4  
**Severidad**: Media  

#### Descripción del Problema
El modal de creación de productos no funcionaba correctamente:
- Usaba sintaxis deprecada `*ngFor` en lugar de `@for` (Angular 17+)
- Intentaba establecer `createdAt` y `updatedAt` manualmente causando conflictos

#### Síntomas Observados
1. Warning de sintaxis deprecada en consola
2. Productos no se guardaban correctamente
3. Conflictos con timestamps automáticos del DatabaseService

#### Solución Implementada

##### 1. Actualización de Sintaxis Angular 17+
```typescript
// Antes (deprecado)
*ngFor="let color of colors; trackBy: trackByFn"

// Después (Angular 17+)
@for (color of colors; track color.id) {
  <option [value]="color.code">{{color.code}} - {{color.name}}</option>
}
```

##### 2. Eliminación de Timestamps Manuales
```typescript
// Removidos createdAt y updatedAt del objeto producto
// DatabaseService los agrega automáticamente
const product = {
  businessId,
  code: generatedSKU,
  name: this.productForm.value.name,
  // ... otros campos
  // createdAt y updatedAt REMOVIDOS
};
```

#### Archivos Modificados
- `src/app/modules/stockin-manager/pages/products/create-product/create-product.modal.ts`

#### Resultado
✅ Creación de productos funciona correctamente  
✅ Sintaxis Angular 17+ actualizada  
✅ Sin conflictos de timestamps  

---

### Error #4: Lógica de Filtrado de Atributos Incorrecta
**Fecha**: Julio 2025  
**Versión**: v.0.6.5  
**Severidad**: Alta  

#### Descripción del Problema
Al desactivar un atributo, este desaparecía completamente de la página de gestión de atributos, cuando debería seguir visible pero marcado como inactivo.

#### Síntomas Observados
1. Atributos desactivados desaparecían de la lista de gestión
2. No había forma de reactivar atributos una vez desactivados
3. Inconsistencia entre gestión y selectores de productos

#### Causa Raíz
1. **Filtro por Defecto**: El filtro estaba configurado para mostrar solo activos (`active: true`)
2. **Lógica de Filtrado**: No contemplaba mostrar todos los estados
3. **Selector Limitado**: Solo tenía opciones "Activos/Inactivos", no "Todos"

#### Solución Implementada

##### 1. Configuración de Filtros
```typescript
// Antes
filters: AttributeFilters = {
  search: '',
  type: null,
  active: true  // Solo activos
};

// Después  
filters: AttributeFilters = {
  search: '',
  type: null,
  active: null  // Todos por defecto
};
```

##### 2. Lógica de Filtrado Condicional
```typescript
// Antes
filtered = filtered.filter(attr => attr.isActive === this.filters.active);

// Después
if (this.filters.active !== null) {
  filtered = filtered.filter(attr => attr.isActive === this.filters.active);
}
```

##### 3. Selector Mejorado
```html
<select [(ngModel)]="filters.active">
  <option [value]="null">Todos</option>
  <option [value]="true">Activos</option>
  <option [value]="false">Inactivos</option>
</select>
```

##### 4. Modelo de Datos Actualizado
```typescript
interface AttributeFilters {
  search: string;
  type: AttributeType | null;
  active: boolean | null;  // Permite null para "todos"
}
```

#### Archivos Modificados
- `src/app/modules/stockin-manager/models/attribute.model.ts`
- `src/app/modules/stockin-manager/pages/attributes/attributes.page.ts`

#### Resultado
✅ Atributos inactivos permanecen visibles en gestión  
✅ Solo atributos activos aparecen en selectores de productos  
✅ Filtro "Todos/Activos/Inactivos" funcional  
✅ Posibilidad de reactivar atributos desactivados  

---

### Error #5: EditProductModal sin Atributos Dinámicos
**Fecha**: Julio 2025  
**Versión**: v.0.6.5  
**Severidad**: Media  

#### Descripción del Problema
El modal de edición de productos usaba inputs de texto simples para atributos (color, tamaño, material) en lugar de selectores dinámicos como el modal de creación.

#### Síntomas Observados
1. Inconsistencia entre creación y edición de productos
2. No se beneficiaba del sistema de atributos dinámicos
3. Posibilidad de crear valores inconsistentes

#### Solución Implementada

##### 1. Importación del AttributeService
```typescript
import { AttributeService } from '../../../services/attribute.service';
import { Attribute } from '../../../models/attribute.model';
```

##### 2. Carga de Atributos
```typescript
colors: Attribute[] = [];
sizes: Attribute[] = [];
materials: Attribute[] = [];

private loadAttributes(): void {
  this.attributeService.getAttributesByType('color')
    .pipe(takeUntil(this.destroy$))
    .subscribe(colors => this.colors = colors);
  // ... similar para sizes y materials
}
```

##### 3. Template con Selectores Dinámicos
```html
<!-- Antes: Input simple -->
<input type="text" formControlName="color">

<!-- Después: Selector dinámico -->
<select formControlName="color">
  <option value="">Seleccionar color</option>
  @for (color of colors; track color.id) {
    <option [value]="color.code">{{color.code}} - {{color.name}}</option>
  }
</select>
```

#### Archivos Modificados
- `src/app/modules/stockin-manager/pages/products/edit-product/edit-product.modal.ts`
- `src/app/modules/stockin-manager/pages/products/edit-product/edit-product.modal.html`

#### Resultado
✅ Consistencia entre creación y edición  
✅ Uso de atributos dinámicos en edición  
✅ Solo atributos activos en selectores  
✅ Prevención de valores inconsistentes  

---

### Error #6: QueryConstraint Type Mismatch en DatabaseService
**Fecha**: Julio 2025  
**Versión**: v.0.6.5  
**Severidad**: Baja  

#### Descripción del Problema
Error de TypeScript al compilar:
- `Argument of type 'QueryOrderByConstraint' is not assignable to parameter of type 'QueryFieldFilterConstraint'`

#### Causa Raíz
Array de `queryConstraints` no estaba tipado correctamente como `QueryConstraint[]`

#### Solución Implementada
```typescript
// Antes
const queryConstraints = [where(field, operator, value)];

// Después
const queryConstraints: QueryConstraint[] = [where(field, operator, value)];
```

#### Archivos Modificados
- `src/app/core/services/database.service.ts`

#### Resultado
✅ Compilación exitosa sin errores de TypeScript  
✅ Tipado correcto de constraints  

### Error #7: Selector de Negocios no Visible para Usuario Root
**Fecha**: Julio 2025  
**Versión**: v.0.6.5  
**Severidad**: Alta  

#### Descripción del Problema
Después del login, el usuario root podía seleccionar un negocio para administrar, pero luego el selector de negocios no aparecía en el navbar del módulo stockin-manager, impidiendo cambiar entre negocios sin hacer logout.

#### Síntomas Observados
1. Usuario root ve selector inicial después del login
2. Después de seleccionar negocio, desaparece el selector del navbar
3. No hay forma de cambiar de negocio sin hacer logout
4. El botón del business selector no se renderiza

#### Causa Raíz
1. **Subscripción Problemática**: El navbar usaba una variable local `isRootUser` actualizada vía subscripción que podía fallar
2. **Lógica Indirecta**: El método `isRoot()` devolvía `this.isRootUser` en lugar de consultar directamente el AuthService
3. **Sintaxis Deprecada**: Uso de `*ngIf` en lugar de `@if` (Angular 17+)

#### Solución Implementada

##### 1. Lógica de Detección de Usuario Root Directa
```typescript
// Antes: Variable local con subscripción
isRootUser = false;
constructor() {
  this.authService.currentUser$.subscribe(user => {
    this.isRootUser = user?.roleId === 'root';
  });
}
isRoot(): boolean {
  return this.isRootUser;
}

// Después: Consulta directa al AuthService
constructor() {
  // Sin subscripción a currentUser$
}
isRoot(): boolean {
  return this.authService.isRoot();
}
```

##### 2. Actualización Sintaxis Angular 17+
```html
<!-- Antes: Sintaxis deprecada -->
<div *ngIf="isRoot()" class="relative">
  <button>Business Selector</button>
</div>

<!-- Después: Control Flow Angular 17+ -->
@if (isRoot()) {
  <div class="relative">
    <button>Business Selector</button>
  </div>
}
```

##### 3. Eliminación de Variable de Estado Local
```typescript
// Removido completamente
// isRootUser = false;

// Constructor simplificado sin subscripciones innecesarias
```

#### Archivos Modificados
- `src/app/modules/stockin-manager/components/shared/navbar.component.ts`

#### Resultado
✅ Selector de negocios siempre visible para usuarios root  
✅ Funcionalidad de cambio de negocio persistente  
✅ Sintaxis Angular 17+ actualizada en todo el template  
✅ Lógica simplificada y más confiable  

#### Lecciones Aprendidas
- Preferir consultas directas a servicios sobre variables locales con subscripciones
- Las subscripciones pueden perderse o fallar en ciertos escenarios
- Mantener lógica de autenticación centralizada en AuthService
- Actualizar sintaxis deprecada proactivamente

---

## 📋 Patrones de Errores Identificados

### 1. Duplicación de Datos
**Patrón**: Consultas complejas de Firestore generan duplicados  
**Solución**: Client-side filtering con Set para IDs únicos  
**Prevención**: Simplificar consultas + filtrado en cliente  

### 2. Sintaxis Deprecada Angular
**Patrón**: Uso de `*ngFor`, `*ngIf` en Angular 17+  
**Solución**: Migrar a `@for`, `@if` control flow  
**Prevención**: Mantener sintaxis actualizada desde el inicio  

### 3. Conflictos de Timestamps
**Patrón**: Timestamps manuales vs automáticos del servicio  
**Solución**: Dejar que DatabaseService maneje timestamps  
**Prevención**: Documentar claramente responsabilidades del servicio  

### 4. TypeScript Type Safety
**Patrón**: Acceso a propiedades en tipos genéricos  
**Solución**: Type assertions o constraints apropiadas  
**Prevención**: Definir interfaces claras para tipos genéricos  

### 5. Inconsistencia en UX
**Patrón**: Diferentes comportamientos entre componentes similares  
**Solución**: Estandarizar patrones de UI/UX  
**Prevención**: Crear componentes reutilizables  

### 6. Estado Local vs Servicios
**Patrón**: Variables locales con subscripciones que fallan  
**Solución**: Consultas directas a servicios centralizados  
**Prevención**: Minimizar estado local, usar servicios como fuente de verdad  

---

## 🛡️ Mejores Prácticas Derivadas

### 1. Firestore
- Preferir consultas simples + client-side filtering
- Implementar filtros de duplicados en servicios base
- Validar referencias de documento antes de operaciones

### 2. Angular
- Usar sintaxis Angular 17+ desde el inicio
- Mantener consistency entre componentes similares
- Implementar proper TypeScript typing

### 3. Estado y Datos
- Centralizar lógica de timestamps en servicios
- Implementar validación tanto cliente como servidor
- Mantener separation of concerns clara

### 4. Desarrollo con IA
- Documentar patrones de errores para contexto futuro
- Mantener registro detallado de soluciones
- Actualizar documentación con cada resolución

---

## 📚 Referencias Útiles

### Comandos de Debugging
```bash
# Ver errores de compilación
ng build --configuration production

# Analizar bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/angema-web/stats.json

# Verificar sintaxis
ng lint

# Ver logs de Firestore
# En console.firebase.google.com → Firestore → Debug
```

### Herramientas de Desarrollo
- **Angular DevTools**: Para debugging de componentes
- **Firebase Console**: Para reglas y datos de Firestore
- **Chrome DevTools**: Para performance y network analysis
- **TypeScript Compiler**: Para verificación de tipos

### Recursos de Documentación
- [Angular Control Flow](https://angular.io/guide/templates/control-flow)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)