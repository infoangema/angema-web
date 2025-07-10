import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateCategoryModal } from './create-category/create-category.modal';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';

@Component({
  selector: 'stockin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateCategoryModal, StockinNavbarComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Categorías</h1>
          <p class="text-gray-600 dark:text-gray-400">Gestiona las categorías de productos</p>
        </div>

        <!-- Actions Bar -->
        <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm mb-6">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div class="flex-1 max-w-md">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="filterCategories()"
                  placeholder="Buscar categorías..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nueva Categoría
            </button>
          </div>
        </div>

        <!-- Categories Table -->
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-6 py-3">
                    Nombre
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Descripción
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Categoría Padre
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let category of filteredCategories"
                    class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {{ category.name }}
                  </td>
                  <td class="px-6 py-4">
                    {{ category.description || '-' }}
                  </td>
                  <td class="px-6 py-4">
                    {{ getParentCategoryName(category.parentId) }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ category.isActive ? 'Activa' : 'Inactiva' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button
                        (click)="editCategory(category)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        (click)="deleteCategory(category)"
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredCategories.length === 0" class="text-center py-12">
          <div class="flex flex-col items-center">
            <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay categorías</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">Crea tu primera categoría para comenzar.</p>
            <button
              (click)="openCreateModal()"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Nueva Categoría
            </button>
          </div>
        </div>

        <!-- Modal -->
        <app-create-category-modal
          *ngIf="showModal"
          [category]="selectedCategory"
          (modalClose)="onModalClose()"
        ></app-create-category-modal>
        </div>
      </main>
    </div>
  `,
  styleUrls: []
})
export class CategoriesPage implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchQuery: string = '';
  isRoot = false;
  showModal = false;
  selectedCategory?: Category;

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
    this.showModal = true;
  }

  editCategory(category: Category) {
    this.selectedCategory = category;
    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
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
