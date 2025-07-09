import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'stockin-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 bg-white px-6 py-3 shadow-sm">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2 text-blue-600">
        <div class="size-7">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fill-rule="evenodd"></path>
          </svg>
        </div>
        <h2 class="text-xl font-semibold tracking-tight">StockIn Manager</h2>
      </div>
      <nav class="flex items-center gap-4">
        <a class="text-blue-600 text-sm font-semibold leading-normal" routerLink="/app/dashboard">Dashboard</a>
        <a class="text-gray-700 hover:text-blue-600 text-sm font-medium leading-normal transition-colors" routerLink="/app/products">Products</a>
        <a class="text-gray-700 hover:text-blue-600 text-sm font-medium leading-normal transition-colors" routerLink="/app/orders">Orders</a>
        <a class="text-gray-700 hover:text-blue-600 text-sm font-medium leading-normal transition-colors" routerLink="/app/customers">Customers</a>
        <a class="text-gray-700 hover:text-blue-600 text-sm font-medium leading-normal transition-colors" routerLink="/app/reports">Reports</a>
      </nav>
    </div>
    <div class="flex items-center gap-4">
      <label class="relative flex items-center">
        <div class="absolute left-3 text-gray-400">
          <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
          </svg>
        </div>
        <input class="form-input w-64 rounded-md border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400" placeholder="Search SKU, Product Name..." />
      </label>
      <button class="relative flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors">
        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
          <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
        </svg>
        <span class="absolute top-1 right-1 flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </button>
      <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-gray-300" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBDmfIK3Of0JKkXUzeK19e_p-yA-j5bmkn-ZyxPV7fzn5sYKyELJ1MJ3OMu6mUrX5NcVvEhjKGJ9FLzgAdrcYrK_pSdVTTHeJM8BqLhgOAl5iK-Hi9fbI-XhHQjYNTHXircZMcP7biDBeiVc7woJNRoyaL6cCry90Gq2Sw8Xh7nQ7uCm6W87fYY7qmWnf88b60KnPZO3RixuJmnX8ZqHrtgiHAPIbBTN1nvnOIdwJcQlHdfLW_yyslRrn5rayq7qzHPUXRssytMcVTA");'></div>
    </div>
  </header>
  `,
  styleUrls: []
})
export class StockinNavbarComponent {} 