# Changelog

Todos los cambios importantes de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere al [Versionado Semántico](https://semver.org/spec/v2.0.0.html).

## [v.0.7.0] - 2025-07-13

### ✨ Nuevo
- **Módulo de Gestión de Clientes/CRM**: Sistema completo de gestión de clientes
  - CRUD completo de clientes con información de contacto, comercial y metadata
  - Búsqueda y filtros avanzados (nombre, email, código, tipo, estado, ciudad)
  - Paginación y ordenamiento automático por fecha de creación
  - Sistema de puntos de fidelización con gestión de acumulación
  - Segmentación básica de clientes (Individual, Empresa, Mayorista, VIP)
  - Exportación de datos a CSV
  - Historial de compras por cliente
  - Integración con sistema multi-tenant por businessId

- **Modal Automático de Selección de Negocio**: Para usuarios root en primer login
  - Aparece automáticamente cuando usuario root no tiene selección válida
  - Fuerza selección explícita antes de acceder al dashboard
  - Validación de selección requerida para continuar
  - Navegación automática a dashboard después de selección

- **CustomerService Reactivo**: Servicio que se actualiza automáticamente
  - Observa cambios en selección de negocio para usuarios root
  - Actualización automática de lista de clientes al cambiar negocio
  - Soporte completo para aislamiento por businessId
  - Métodos CRUD con validación de negocio

### 🐛 Corregido
- **Modal de Edición de Clientes con Pestañas**: Reorganizado formulario excesivamente alto
  - Problema: Modal de edición tenía mucho scroll y era difícil de navegar
  - Solución: Dividido formulario en 3 pestañas (Personal, Dirección, Comercial)
  - Resultado: Modal más compacto y navegable, mejor experiencia de usuario

- **Filtro "Todos los Tipos" No Funcionaba**: Filtro de tipos no mostraba todos después de filtrar
  - Problema: Angular ngModel convertía `null` a string "null" causando problemas de filtro
  - Solución: Cambiado valor de `null` a string vacío `''` para compatibilidad con select
  - Resultado: Filtro "Todos los tipos" funciona correctamente después de filtrar por tipos específicos

- **Error Firestore con Valores Undefined**: Falla al crear clientes por campos undefined
  - Problema: Campos opcionales enviados como `undefined` en lugar de `null` causaban error Firestore
  - Solución: Convertidos todos los campos opcionales de `undefined` a `null` en creación de clientes
  - Resultado: Creación de clientes funciona correctamente sin errores de validación Firestore

- **Lista de Clientes No Visible en Desktop**: Tabla de clientes no se mostraba en pantallas grandes
  - Problema: Clase CSS `hidden md:block` ocultaba la tabla en ciertos tamaños de pantalla
  - Solución: Removida restricción de responsive design para mostrar tabla en todos los tamaños
  - Resultado: Lista de clientes visible en desktop, tablet y móvil con diseño adaptativo

- **Error de Sintaxis Angular 17+**: Corregida sintaxis incorrecta de @switch en atributos
  - Problema: `@switch` dentro de atributo `class` causaba falla silenciosa de renderizado
  - Solución: Implementado método `getCustomerTypeClasses()` con lógica switch
  - Resultado: Sintaxis de template corregida y compatible con Angular 17+

- **Modal Container No Configurado**: Error al abrir selector de negocios desde navbar
  - Problema: ModalService requería ViewContainerRef configurado en cada página
  - Solución: Configurado modalContainer en páginas que usan ModalService
  - Resultado: Modal de selector de negocios funciona desde navbar

- **Modal de Selector No Se Cierra**: Problemas con cierre de modal en diferentes contextos
  - Problema: Incompatibilidad entre modal dinámico (navbar) y binding directo (login)
  - Solución: Implementada compatibilidad dual con try-catch graceful
  - Resultado: Modal se cierra correctamente en ambos contextos

- **CustomerService No Reactivo**: Clientes no aparecían después de seleccionar negocio
  - Problema: Servicio consultaba businessId solo una vez al inicializar
  - Solución: Implementado patrón reactivo con switchMap escuchando selection$
  - Resultado: Lista de clientes se actualiza automáticamente con cambios de negocio

- **Filtros por Defecto Incorrectos**: Filtros ocultaban clientes sin motivo aparente
  - Problema: Filtro de estado activo configurado como `true` por defecto
  - Solución: Configurados filtros neutrales (null) para mostrar todos por defecto
  - Resultado: Clientes aparecen sin filtros al cargar página

### 🔧 Mejorado
- **Arquitectura Multi-Tenant**: Reforzado aislamiento por businessId
  - Todos los datos de clientes filtrados por negocio seleccionado
  - Validación de businessId en operaciones CRUD
  - Soporte para usuarios root con selección dinámica de negocio

- **Gestión de Modales**: Sistema de modales más robusto
  - Compatibilidad dual entre modales dinámicos y binding directo
  - Validación de selección en modal de negocios
  - Setup automático de ViewContainerRef en páginas

- **Integración RxJS**: Patrones reactivos mejorados
  - CustomerService totalmente reactivo con switchMap
  - Observables tipados correctamente
  - Manejo de errores y estados de loading

### 📚 Documentación
- **Errores Documentados**: Agregados 5 nuevos patrones de errores en errors.md
  - Error #8: CustomerService Observable Type Mismatch
  - Error #9: Modal Container Not Set
  - Error #10: Business Selector Modal No Se Cierra
  - Error #11: CustomerService No Reactivo a Cambios de Negocio
  - Error #12: Filtros de Clientes por Defecto Incorrectos

- **Guías de Servicios**: Agregadas guías detalladas en structure.md
  - RootBusinessSelectorService: Patrones reactivos y uso correcto
  - ModalService: Setup requerido y compatibilidad dual
  - CustomerService: Funcionalidades CRM y filtros
  - DatabaseService: Mejores prácticas y optimizaciones
  - Checklist para implementación de nuevos módulos

### 🧪 Técnico
- **Archivos Principales Modificados**:
  - `customer.model.ts`: Modelo completo con loyaltyPoints y totalPurchases
  - `customer.service.ts`: Servicio reactivo con aislamiento por negocio
  - `customers-list.component.ts`: Lista con filtros y paginación
  - `login.component.ts`: Modal automático para usuarios root
  - `business-selector-modal.component.ts`: Validación y compatibilidad dual

- **Patrones Implementados**:
  - Servicios reactivos multi-tenant
  - Modal management con ViewContainerRef
  - Filtros neutrales por defecto
  - Error handling consistente

## [v.0.6.6] - 2025-07-12

### 🎨 Mejorado
- **Estandarización de Layout de Contenedores**: Unificado el ancho de contenedores en todas las páginas de gestión
  - Aplicado layout `container mx-auto px-4 py-6` consistente en productos, categorías, almacenes y atributos
  - Mejorada consistencia visual y experiencia de usuario
  - Layout más amplio y espacioso para mejor visualización de datos

### 🔧 Cambiado  
- **Modernización de Templates Angular**: Actualizada sintaxis de templates a Angular 17+
  - Convertidos `*ngFor` y `*ngIf` a nueva sintaxis `@for` y `@if`
  - Mejorada legibilidad y rendimiento de templates
  - Eliminadas advertencias de sintaxis deprecada

### 🐛 Corregido
- **Selector de Negocio para Usuarios Root**: Solucionado problema de visibilidad del selector
  - El selector de negocio ahora permanece visible después de seleccionar un negocio
  - Usuarios root pueden cambiar de contexto de negocio sin necesidad de logout
  - Reemplazado estado local con llamadas directas a AuthService
  - Actualizada sintaxis de template deprecada

### 🏗️ Técnico
- **Optimización de Templates**: Eliminadas dependencias circulares y mejorada estructura
- **Corrección de Sintaxis**: Solucionados errores de compilación en templates
- **Limpieza de Imports**: Removidos imports no utilizados y advertencias

### 📱 UI/UX
- **Consistencia Visual**: Todas las páginas de gestión ahora tienen el mismo ancho de contenedor
- **Experiencia Mejorada**: Layout más amplio proporciona mejor visualización de tablas y contenido

---

## [v.0.6.5] - 2025-07-12

### ✨ Agregado
- **Sistema de Gestión de Atributos Dinámicos**: Implementado sistema completo de atributos dinámicos para productos
  - Agregada colección "attributes" en Firestore con aislamiento por negocio
  - Creada página de gestión de atributos con operaciones CRUD completas (`/app/attributes`)
  - Soporte para colores, tamaños y materiales con opciones predefinidas
  - Acceso basado en permisos (solo usuarios root y admin)

### 🔧 Cambiado
- **Mejora en Creación de Productos**: Actualizado modal de creación para usar atributos dinámicos
  - Reemplazados dropdowns hardcodeados con carga dinámica de atributos
  - Agregado campo "grams" en inglés a los atributos del producto
  - Mejorada generación de SKU para incluir campo grams
  
- **Mejora en Edición de Productos**: Actualizado modal de edición para usar atributos dinámicos
  - Convertidos inputs de texto a dropdowns dinámicos para color, tamaño y material
  - Flujo de trabajo consistente entre creación y edición de atributos

### 🐛 Corregido
- **Lógica de Visibilidad de Atributos**: Corregido filtrado de atributos en página de gestión
  - Los atributos inactivos ahora permanecen visibles en la interfaz de gestión
  - Solo los atributos activos aparecen en los selectores de creación/edición de productos
  - Agregadas opciones de filtro "Todos/Activos/Inactivos" en gestión de atributos

### 🏗️ Técnico
- **AttributeService**: Implementado servicio completo con operaciones CRUD conscientes del negocio
- **Optimización Firestore**: Optimizadas consultas para evitar índices complejos usando filtrado del lado del cliente
- **Actualizaciones en Tiempo Real**: Agregado flujo de datos reactivo para actualizaciones inmediatas de UI
- **Seguridad de Tipos**: Mejoradas interfaces TypeScript para atributos y filtros

### 📚 Documentación
- **FIRESTORE_SETUP.md**: Agregada guía comprensiva de configuración de Firestore
- **Modelos de Atributos**: Documentadas estructuras de datos y relaciones
- **Reglas de Seguridad**: Proporcionadas directrices de aislamiento de datos por negocio

### 🔐 Seguridad
- **Aislamiento por Negocio**: Los atributos están apropiadamente aislados por ID de negocio
- **Acceso Basado en Roles**: Funciones de gestión restringidas a usuarios root/admin
- **Validación de Datos**: Implementada validación de unicidad de códigos por negocio y tipo

---

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