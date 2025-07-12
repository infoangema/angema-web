# Changelog

Todos los cambios importantes de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [v.0.5.4] - 2025-07-12

### Corregido
- **Errores de tracking y referencias de documento en edición de productos**
  - Solucionados errores de Firestore tracking expressions y duplicate keys
  - Corregidas referencias inválidas de documento en updateProduct
  - Asegurado que el ID de Firestore tenga precedencia sobre datos del documento
  - Prevenidos duplicados en arrays de productos para @for loops
  - Agregado debugging temporal para diagnosticar problemas de ID
  - Simplificadas consultas complejas en ProductService
  - Mejorado mapeo de documentos en DatabaseService para evitar sobrescritura de IDs

### Errores específicos corregidos
- `NG6055: The provided track expression resulted in duplicated keys`
- `FirebaseError: Invalid document reference (segments < 2)`
- `TS2339: Property 'id' does not exist on type 'T'`
- Error updating product en modal de edición

### Archivos modificados
- `src/app/core/services/database.service.ts` - Mapeo seguro de documentos y filtros de duplicados
- `src/app/modules/stockin-manager/services/product.service.ts` - Consultas simplificadas
- `src/app/modules/stockin-manager/pages/products/products-list/products-list.component.ts` - Prevención duplicados
- `src/app/modules/stockin-manager/pages/products/edit-product/edit-product.modal.ts` - Debugging y validaciones

### Funcionalidad mejorada
- ✅ Edición de productos sin errores de tracking
- ✅ Actualización de precios funciona correctamente
- ✅ Modal de edición estable y confiable
- ✅ Sin duplicados en lista de productos
- ✅ Referencias de documento válidas en todas las operaciones

---

## Formato del Changelog

### Tipos de cambios
- **Agregado** para nuevas funcionalidades
- **Cambiado** para cambios en funcionalidades existentes
- **Deprecated** para funcionalidades que serán removidas próximamente
- **Removido** para funcionalidades removidas
- **Corregido** para corrección de bugs
- **Seguridad** para vulnerabilidades de seguridad