# Configuración de Firestore para StockIn Manager

## Índices Compuestos Requeridos

Si sigues experimentando errores de índices después de las optimizaciones, necesitarás crear estos índices compuestos en la consola de Firebase:

### 1. Para la colección `attributes`:

**Índice 1: Consulta de atributos por negocio y ordenamiento**
- Colección: `attributes`
- Campos:
  - `businessId` (Ascending)
  - `sortOrder` (Ascending)

**Índice 2: Consulta de atributos por negocio y tipo**
- Colección: `attributes` 
- Campos:
  - `businessId` (Ascending)
  - `type` (Ascending)
  - `isActive` (Ascending)

### 2. Para la colección `products` (si es necesario):

**Índice 1: Productos por negocio**
- Colección: `products`
- Campos:
  - `businessId` (Ascending)
  - `isActive` (Ascending)
  - `createdAt` (Descending)

## Cómo crear los índices:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto
3. Ve a Firestore Database
4. Haz clic en la pestaña "Indexes"
5. Haz clic en "Create Index"
6. Agrega los campos como se especifica arriba

## Reglas de Seguridad de Firestore

Asegúrate de tener estas reglas configuradas en Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a usuarios autenticados
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Reglas específicas para atributos
    match /attributes/{attributeId} {
      allow read, write: if request.auth != null 
        && (resource.data.businessId == request.auth.token.businessId || 
            request.auth.token.role == 'root');
    }
    
    // Reglas específicas para productos
    match /products/{productId} {
      allow read, write: if request.auth != null
        && (resource.data.businessId == request.auth.token.businessId || 
            request.auth.token.role == 'root');
    }
  }
}
```

## Optimizaciones Aplicadas

Para reducir la necesidad de índices complejos, hemos:

1. **Simplificado consultas**: Usamos filtros simples y ordenamos en el cliente
2. **Filtrado en cliente**: Para `isCodeUnique()` obtenemos todos los atributos del negocio y filtramos en JavaScript
3. **Ordenamiento opcional**: El `getWhere()` en DatabaseService solo aplica `orderBy` si se especifica

## Estructura de Datos

### Colección: `attributes`
```typescript
{
  id: string,
  businessId: string,
  type: 'color' | 'size' | 'material',
  code: string,           // Ej: "ROJ", "XL", "ALG"
  name: string,           // Ej: "Rojo", "Extra Large", "Algodón"
  description?: string,
  isActive: boolean,
  sortOrder?: number,
  createdAt: Date,
  updatedAt: Date
}
```

### Relación con Productos
Los productos referencian atributos por su `code`, no por `id`, para mayor flexibilidad.

## Notas Importantes

- Los índices pueden tardar unos minutos en crearse
- Firestore puede sugerir automáticamente algunos índices cuando veas errores en la consola
- Si ves un enlace en el error de Firebase, puedes hacer clic para crear el índice automáticamente