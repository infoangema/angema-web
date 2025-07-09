import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';

@Component({
  selector: 'stockin-products-page',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    <div class="min-h-screen bg-gray-100">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="p-8 text-2xl font-bold text-blue-700">Hola mundo desde Products</div>
      </main>
    </div>
  `
})
export class StockinProductsPage {} 