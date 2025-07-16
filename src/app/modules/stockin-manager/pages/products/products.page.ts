import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';
import { ProductsListComponent } from './products-list/products-list.component';
import { CreateProductModalComponent } from './create-product/create-product.modal';

@Component({
  selector: 'stockin-products-page',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent, PageHeaderComponent, ProductsListComponent, CreateProductModalComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de Productos"
          subtitle="Gestiona tu inventario, agrega nuevos productos y controla el stock"
          [actions]="headerActions">
        </stockin-page-header>

        <app-products-list #productsList></app-products-list>
      </main>
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

  headerActions: PageHeaderAction[] = [
    {
      label: 'Nuevo Producto',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    }
  ];

  openCreateModal() {
    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
    // Refresh the products list after creating a product
    this.productsList.loadProducts(true);
  }
}
