import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { ProductsListComponent } from './products-list/products-list.component';
import { CreateProductModalComponent } from './create-product/create-product.modal';

@Component({
  selector: 'stockin-products-page',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent, ProductsListComponent, CreateProductModalComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Productos</h1>
              <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Gestiona tu inventario, agrega nuevos productos y controla el stock.
              </p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                type="button"
                (click)="openCreateModal()"
                class="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Agregar producto
              </button>
            </div>
          </div>
          <app-products-list #productsList></app-products-list>
        </div>
      </main>
    </div>

    <!-- Modal -->
    <app-create-product-modal 
      *ngIf="showModal" 
      (modalClose)="onModalClose()"
    ></app-create-product-modal>
  `
})
export class StockinProductsPage {
  @ViewChild('productsList') productsList!: ProductsListComponent;
  showModal = false;

  openCreateModal() {
    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
    // Refresh the products list after creating a product
    this.productsList.loadProducts(true);
  }
}
