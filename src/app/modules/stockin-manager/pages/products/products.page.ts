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
    
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p class="text-gray-600 dark:text-gray-400">Gestiona tu inventario, agrega nuevos productos y controla el stock</p>
        </div>
        
        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nuevo Producto
        </button>
      </div>

      <app-products-list #productsList></app-products-list>
    </div>

    <!-- Modal -->
    @if (showModal) {
      <app-create-product-modal 
        (modalClose)="onModalClose()">
      </app-create-product-modal>
    }
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
