import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Attribute, AttributeType, AttributeFilters } from '../../models/attribute.model';
import { AttributeService } from '../../services/attribute.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreateAttributeModalComponent } from './create-attribute/create-attribute.modal';
import { EditAttributeModalComponent } from './edit-attribute/edit-attribute.modal';

// Import navbar and page header
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';

@Component({
  selector: 'app-attributes',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    StockinNavbarComponent,
    PageHeaderComponent,
    CreateAttributeModalComponent,
    EditAttributeModalComponent
  ],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de Atributos"
          subtitle="Gestiona los atributos dinámicos de productos (colores, tamaños, materiales)"
          [actions]="headerActions">
        </stockin-page-header>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Buscar</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (input)="onFiltersChange()"
              placeholder="Buscar por código o nombre..."
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tipo</label>
            <select
              [(ngModel)]="filters.type"
              (change)="onFiltersChange()"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
              <option value="">Todos los tipos</option>
              <option value="color">Color</option>
              <option value="size">Tamaño</option>
              <option value="material">Material</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Estado</label>
            <select
              [(ngModel)]="filters.active"
              (change)="onFiltersChange()"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
              <option [value]="null">Todos</option>
              <option [value]="true">Activos</option>
              <option [value]="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Lista de atributos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tipo
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                @if (canManageAttributes) {
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                }
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading) {
                <tr>
                  <td [colSpan]="canManageAttributes ? 6 : 5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Cargando atributos...
                  </td>
                </tr>
              } @else if (filteredAttributes.length === 0) {
                <tr>
                  <td [colSpan]="canManageAttributes ? 6 : 5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron atributos
                  </td>
                </tr>
              } @else {
                @for (attribute of filteredAttributes; track attribute.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getTypeClass(attribute.type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {{getTypeLabel(attribute.type)}}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {{attribute.code}}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{attribute.name}}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {{attribute.description || '-'}}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="attribute.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'" 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {{attribute.isActive ? 'Activo' : 'Inactivo'}}
                      </span>
                    </td>
                    @if (canManageAttributes) {
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                          <button
                            (click)="editAttribute(attribute)"
                            class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            Editar
                          </button>
                          @if (attribute.isActive) {
                            <button
                              (click)="toggleAttributeStatus(attribute)"
                              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              Desactivar
                            </button>
                          } @else {
                            <button
                              (click)="toggleAttributeStatus(attribute)"
                              class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                              Activar
                            </button>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>

    <!-- Modales -->
    @if (isCreateModalVisible) {
      <app-create-attribute-modal
        (modalClose)="closeCreateModal()"
        (attributeCreated)="onAttributeCreated()">
      </app-create-attribute-modal>
    }

    @if (isEditModalVisible && selectedAttribute) {
      <app-edit-attribute-modal
        [attribute]="selectedAttribute"
        (modalClose)="closeEditModal()"
        (attributeUpdated)="onAttributeUpdated()"
        (attributeDeleted)="onAttributeDeleted()">
      </app-edit-attribute-modal>
    }
  `
})
export class AttributesPage implements OnInit, OnDestroy {
  attributes: Attribute[] = [];
  filteredAttributes: Attribute[] = [];
  loading = false;
  
  // Modal state
  isCreateModalVisible = false;
  isEditModalVisible = false;
  selectedAttribute: Attribute | null = null;

  // Filtros
  filters: AttributeFilters = {
    search: '',
    type: null,
    active: null // null = mostrar todos
  };

  private destroy$ = new Subject<void>();

  // Header actions
  headerActions: PageHeaderAction[] = [];

  // Permisos
  get canManageAttributes(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }

  constructor(
    private attributeService: AttributeService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check permissions - only root and admin can access
    if (!this.canManageAttributes) {
      this.router.navigate(['/app/dashboard']);
      return;
    }
    
    // Initialize header actions based on permissions
    if (this.canManageAttributes) {
      this.headerActions = [
        {
          label: 'Nuevo Atributo',
          icon: PageHeaderIcons.add,
          color: 'blue',
          action: () => this.openCreateModal()
        }
      ];
    }
    
    this.loadAttributes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAttributes(): void {
    this.loading = true;
    this.attributeService.watchAttributes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (attributes) => {
          this.attributes = attributes;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading attributes:', error);
          this.loading = false;
        }
      });
  }

  onFiltersChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.attributes];

    // Filtro por búsqueda
    if (this.filters.search.trim()) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(attr => 
        attr.code.toLowerCase().includes(searchTerm) ||
        attr.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro por tipo
    if (this.filters.type) {
      filtered = filtered.filter(attr => attr.type === this.filters.type);
    }

    // Filtro por estado (solo si se especifica)
    if (this.filters.active !== null) {
      filtered = filtered.filter(attr => attr.isActive === this.filters.active);
    }

    this.filteredAttributes = filtered;
  }

  // Métodos para los modales
  openCreateModal(): void {
    this.isCreateModalVisible = true;
  }

  closeCreateModal(): void {
    this.isCreateModalVisible = false;
  }

  onAttributeCreated(): void {
    this.closeCreateModal();
    // Los atributos se actualizan automáticamente por el observable
  }

  editAttribute(attribute: Attribute): void {
    this.selectedAttribute = attribute;
    this.isEditModalVisible = true;
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.selectedAttribute = null;
  }

  onAttributeUpdated(): void {
    this.closeEditModal();
    // Los atributos se actualizan automáticamente por el observable
  }

  onAttributeDeleted(): void {
    this.closeEditModal();
    // Los atributos se actualizan automáticamente por el observable
  }

  async toggleAttributeStatus(attribute: Attribute): Promise<void> {
    try {
      await this.attributeService.updateAttribute(attribute.id, {
        isActive: !attribute.isActive
      });
      
      const action = attribute.isActive ? 'desactivado' : 'activado';
      this.notificationService.success(`Atributo ${action} exitosamente`);
    } catch (error) {
      console.error('Error toggling attribute status:', error);
      this.notificationService.error('Error al cambiar el estado del atributo');
    }
  }

  // Métodos auxiliares
  getTypeLabel(type: AttributeType): string {
    switch (type) {
      case 'color': return 'Color';
      case 'size': return 'Tamaño';
      case 'material': return 'Material';
      default: return type;
    }
  }

  getTypeClass(type: AttributeType): string {
    switch (type) {
      case 'color': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'size': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'material': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }
}