import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateCategoryModal } from './create-category/create-category.modal';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';

@Component({
  selector: 'stockin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateCategoryModal, StockinNavbarComponent, PageHeaderComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de Categorías"
          subtitle="Organiza y gestiona las categorías de productos"
          [actions]="headerActions">
        </stockin-page-header>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Buscar</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="filterCategories()"
              placeholder="Buscar categorías..."
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
          </div>
        </div>
      </div>

      <!-- Lista de categorías -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              @for (category of filteredCategories; track category.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {{ category.name }}
                  </td>
                  <td class="px-6 py-4">
                    {{ category.description || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span [class]="category.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'" 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {{category.isActive ? 'Activa' : 'Inactiva'}}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                      <button
                        (click)="editCategory(category)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        Editar
                      </button>
                      <button
                        (click)="deleteCategory(category)"
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      </main>
    </div>

    <!-- Modal -->
    @if (showCreateModal) {
      <app-create-category-modal 
        [category]="selectedCategory"
        (modalClose)="onModalClosed()">
      </app-create-category-modal>
    }
  `,
  styleUrls: []
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchQuery: string = '';
  isRoot = false;
  showCreateModal = false;
  selectedCategory?: Category;

  headerActions: PageHeaderAction[] = [
    {
      label: 'Nueva Categoría',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.checkUserRole();
  }

  private checkUserRole() {
    this.authService.currentUser$.subscribe(user => {
      this.isRoot = user?.roleId === 'root';
    });
  }

  async loadCategories() {
    try {
      this.categories = await this.categoryService.getCategories();
      this.filteredCategories = [...this.categories];
    } catch (error) {
      this.notificationService.error('Error al cargar categorías');
    }
  }

  filterCategories() {
    if (!this.searchQuery.trim()) {
      this.filteredCategories = [...this.categories];
      return;
    }

    this.filteredCategories = this.categories.filter(category =>
      category.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  getParentCategoryName(parentId?: string): string {
    if (!parentId) return '-';
    const parent = this.categories.find(cat => cat.id === parentId);
    return parent ? parent.name : '-';
  }

  openCreateModal() {
    this.selectedCategory = undefined;
    this.showCreateModal = true;
  }

  editCategory(category: Category) {
    this.selectedCategory = category;
    this.showCreateModal = true;
  }

  onModalClosed() {
    this.showCreateModal = false;
    this.selectedCategory = undefined;
    this.loadCategories();
  }

  async deleteCategory(category: Category) {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
      try {
        await this.categoryService.deleteCategory(category.id);
        this.notificationService.success('Categoría eliminada correctamente');
        await this.loadCategories();
      } catch (error) {
        this.notificationService.error('Error al eliminar categoría');
      }
    }
  }
}
