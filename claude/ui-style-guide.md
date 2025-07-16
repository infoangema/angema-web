# UI Style Guide - StockIn Manager

## Guía de Estilo para Páginas Principales

Este documento establece los estándares de diseño y estructura para todas las páginas del módulo StockIn Manager, basado en el estilo implementado en la página de "Órdenes".

---

## 1. Estructura Base de Página

### Template Structure
```html
<stockin-navbar></stockin-navbar>

<div class="min-h-screen bg-gray-100">
  <main class="container mx-auto px-4 py-6">
    <stockin-page-header 
      title="Gestión de [Módulo]"
      subtitle="Descripción del módulo y sus funcionalidades"
      [actions]="headerActions">
    </stockin-page-header>

    <!-- Contenido principal -->
    <!-- Stats Cards, Filters, Lists, etc. -->

  </main>
</div>

<!-- Modals -->
@if (showModal) {
  <app-modal-component 
    (modalClose)="onModalClose()">
  </app-modal-component>
}
```

### Clases CSS Requeridas
- **Container principal**: `min-h-screen bg-gray-100`
- **Main wrapper**: `container mx-auto px-4 py-6`
- **Spacing**: `mb-6` entre secciones principales

---

## 2. Componente PageHeader

### Imports Requeridos
```typescript
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';
```

### Configuración del Header
```typescript
headerActions: PageHeaderAction[] = [
  {
    label: 'Nuevo [Elemento]',
    icon: PageHeaderIcons.add,
    color: 'blue',
    action: () => this.openCreateModal()
  },
  {
    label: 'Exportar CSV',
    icon: PageHeaderIcons.export,
    color: 'green',
    action: () => this.exportData()
  }
];
```

### Patrones de Títulos
| Página | Título | Subtítulo |
|--------|--------|-----------|
| Productos | "Gestión de Productos" | "Gestiona tu inventario, agrega nuevos productos y controla el stock" |
| Clientes | "Gestión de Clientes" | "Administra tu base de clientes y gestiona la información de contacto" |
| Órdenes | "Gestión de Órdenes" | "Administra las órdenes de venta de tu negocio" |
| Categorías | "Gestión de Categorías" | "Organiza y gestiona las categorías de productos" |
| Almacenes | "Gestión de Almacenes" | "Organiza y gestiona los almacenes de tu negocio" |
| Atributos | "Gestión de Atributos" | "Gestiona los atributos dinámicos de productos (colores, tamaños, materiales)" |

---

## 3. Colores de Acciones

### Colores Estándar
```typescript
interface ActionColors {
  blue: string;    // Acciones principales (Nuevo, Editar)
  green: string;   // Exportar, Confirmar, Éxito
  red: string;     // Eliminar, Cancelar, Peligro
  yellow: string;  // Advertencias, Pendiente
  gray: string;    // Acciones secundarias
  indigo: string;  // Acciones especiales
  purple: string;  // Acciones premium
}
```

### Uso Recomendado
- **Azul**: Acciones principales de creación y edición
- **Verde**: Exportación, confirmación, acciones de éxito
- **Rojo**: Eliminación, cancelación, acciones peligrosas
- **Amarillo**: Advertencias, estados pendientes
- **Gris**: Acciones secundarias o neutras

---

## 4. Iconos Estándar

### Iconos Más Utilizados
```typescript
// Acciones principales
PageHeaderIcons.add       // Agregar nuevo elemento
PageHeaderIcons.edit      // Editar elemento
PageHeaderIcons.delete    // Eliminar elemento

// Datos
PageHeaderIcons.export    // Exportar datos
PageHeaderIcons.import    // Importar datos
PageHeaderIcons.view      // Ver detalles

// Utilidades
PageHeaderIcons.refresh   // Actualizar datos
PageHeaderIcons.filter    // Filtrar resultados
PageHeaderIcons.search    // Buscar elementos
PageHeaderIcons.settings  // Configuración
```

---

## 5. Secciones Adicionales

### Stats Cards (Opcional)
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <!-- Icon path -->
          </svg>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500">Etiqueta</p>
        <p class="text-lg font-semibold text-gray-900">{{ valor }}</p>
      </div>
    </div>
  </div>
</div>
```

### Filters Section (Opcional)
```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Filtros -->
  </div>
</div>
```

### Content Section
```html
<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <!-- Contenido principal (tablas, listas, etc.) -->
</div>
```

---

## 6. Responsividad

### Breakpoints
- **Mobile**: < 768px - Cards apiladas
- **Tablet**: 768px - 1024px - Grid 2 columnas
- **Desktop**: > 1024px - Grid completo

### Clases Responsive
```css
/* Mobile first */
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

/* Ocultar en móvil */
hidden md:block

/* Mostrar solo en móvil */
md:hidden
```

---

## 7. Implementación Paso a Paso

### Checklist para Nueva Página
- [ ] Importar `PageHeaderComponent` y `PageHeaderAction`
- [ ] Importar `PageHeaderIcons`
- [ ] Agregar `PageHeaderComponent` a imports del componente
- [ ] Crear array `headerActions` con acciones apropiadas
- [ ] Usar estructura HTML base con `min-h-screen bg-gray-100`
- [ ] Implementar `<stockin-page-header>` con título y subtítulo
- [ ] Usar spacing consistente (`mb-6` entre secciones)
- [ ] Aplicar estilos de cards (`bg-white rounded-lg shadow-sm border border-gray-200`)
- [ ] Implementar diseño responsive
- [ ] Agregar modales con patrón `@if (showModal)`

### Ejemplo de Implementación
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';

@Component({
  selector: 'stockin-nueva-pagina',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent, PageHeaderComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de [Módulo]"
          subtitle="Descripción del módulo"
          [actions]="headerActions">
        </stockin-page-header>

        <!-- Contenido principal -->
        
      </main>
    </div>
  `
})
export class NuevaPaginaComponent {
  headerActions: PageHeaderAction[] = [
    {
      label: 'Nuevo [Elemento]',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    }
  ];

  openCreateModal() {
    // Lógica para abrir modal
  }
}
```

---

## 8. Mejores Prácticas

### DO ✅
- Usar `PageHeaderComponent` para todas las páginas principales
- Mantener títulos consistentes con patrón "Gestión de [Módulo]"
- Usar iconos de `PageHeaderIcons` para consistencia
- Implementar estructura HTML base con clases apropiadas
- Aplicar colores estándar según el tipo de acción
- Usar spacing consistente (`mb-6`)

### DON'T ❌
- No crear headers personalizados inline
- No usar colores de botones inconsistentes
- No omitir el wrapper `<main>` con las clases apropiadas
- No usar iconos custom cuando hay alternativas en `PageHeaderIcons`
- No mezclar diferentes patrones de títulos
- No ignorar el diseño responsive

---

## 9. Mantenimiento

### Actualizaciones Futuras
- Nuevos iconos se agregan a `PageHeaderIcons`
- Nuevos colores se definen en `PageHeaderComponent`
- Patrones de títulos se actualizan en esta guía
- Cambios de diseño se implementan en `PageHeaderComponent`

### Contacto
Para dudas o sugerencias sobre el estilo, consultar:
- `claude/ui-style-guide.md` - Esta guía
- `src/app/modules/stockin-manager/components/shared/page-header.component.ts` - Implementación
- `src/app/modules/stockin-manager/components/shared/page-header-icons.ts` - Iconos disponibles

---

*Última actualización: 2025-07-16*
*Versión: 1.0.0*