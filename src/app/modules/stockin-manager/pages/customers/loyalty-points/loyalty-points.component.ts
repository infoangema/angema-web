import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../models/customer.model';
import { CustomerService } from '../../../services/customer.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-loyalty-points',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Puntos de Fidelidad
        </h3>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ customer.loyaltyPoints | number }} puntos
        </div>
      </div>

      <div class="space-y-4">
        <!-- Información del programa -->
        <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Programa de Fidelización
          </h4>
          <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Gana 1 punto por cada $1 gastado</p>
            <p>• 100 puntos = $5 de descuento</p>
            <p>• Los puntos no expiran</p>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ customer.totalPurchases | currency }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Total Gastado</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ getPointsValue() | currency }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Valor en Descuentos</div>
          </div>
        </div>

        <!-- Acciones de puntos -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Gestionar Puntos
          </h4>
          
          <div class="flex space-x-2">
            <input
              type="number"
              [(ngModel)]="pointsAmount"
              min="1"
              placeholder="Cantidad"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            
            <button
              type="button"
              (click)="addPoints()"
              [disabled]="!pointsAmount || pointsAmount <= 0 || isProcessing"
              class="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isProcessing && operation === 'add') {
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              Agregar
            </button>
            
            <button
              type="button"
              (click)="subtractPoints()"
              [disabled]="!pointsAmount || pointsAmount <= 0 || pointsAmount > customer.loyaltyPoints || isProcessing"
              class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isProcessing && operation === 'subtract') {
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              Usar
            </button>
          </div>
          
          <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            @if (pointsAmount && pointsAmount > customer.loyaltyPoints) {
              <p class="text-red-600 dark:text-red-400">
                No hay suficientes puntos disponibles
              </p>
            } @else if (pointsAmount && pointsAmount > 0) {
              <p>
                Equivale a {{ getDiscountValue(pointsAmount) | currency }} en descuentos
              </p>
            }
          </div>
        </div>

        <!-- Niveles de fidelidad -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Nivel de Fidelidad
          </h4>
          
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Nivel actual:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ getCurrentTier().name }}</span>
            </div>
            
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                [class]="getCurrentTier().color"
                [style.width.%]="getTierProgress()">
              </div>
            </div>
            
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{{ getCurrentTier().minSpent | currency }}</span>
              <span>{{ getNextTierMinSpent() }}</span>
            </div>
            
            @if (getNextTier()) {
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Gasta {{ (getNextTier()!.minSpent - customer.totalPurchases) | currency }} más para alcanzar 
                <span class="font-medium">{{ getNextTier()!.name }}</span>
              </p>
            } @else {
              <p class="text-xs text-green-600 dark:text-green-400 font-medium">
                ¡Has alcanzado el nivel máximo!
              </p>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoyaltyPointsComponent {
  @Input() customer!: Customer;
  @Output() pointsUpdated = new EventEmitter<void>();

  pointsAmount: number | null = null;
  isProcessing = false;
  operation: 'add' | 'subtract' | null = null;

  // Configuración del programa de fidelidad
  readonly POINTS_PER_DOLLAR = 1;
  readonly POINTS_TO_DOLLAR = 0.05; // 100 puntos = $5

  readonly loyaltyTiers = [
    { name: 'Bronce', minSpent: 0, color: 'bg-yellow-600', benefits: 'Puntos básicos' },
    { name: 'Plata', minSpent: 500, color: 'bg-gray-400', benefits: 'Puntos x1.2' },
    { name: 'Oro', minSpent: 1500, color: 'bg-yellow-500', benefits: 'Puntos x1.5' },
    { name: 'Platino', minSpent: 3000, color: 'bg-purple-600', benefits: 'Puntos x2.0' },
    { name: 'Diamante', minSpent: 5000, color: 'bg-blue-600', benefits: 'Puntos x2.5' }
  ];

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService
  ) {}

  async addPoints() {
    if (!this.pointsAmount || this.pointsAmount <= 0) return;

    this.isProcessing = true;
    this.operation = 'add';

    try {
      await this.customerService.updateLoyaltyPoints(this.customer.id, this.pointsAmount, 'add');
      this.notificationService.showSuccess(`Se agregaron ${this.pointsAmount} puntos`);
      this.pointsAmount = null;
      this.pointsUpdated.emit();
    } catch (error) {
      console.error('Error adding points:', error);
      this.notificationService.showError('Error al agregar puntos');
    } finally {
      this.isProcessing = false;
      this.operation = null;
    }
  }

  async subtractPoints() {
    if (!this.pointsAmount || this.pointsAmount <= 0 || this.pointsAmount > this.customer.loyaltyPoints) {
      return;
    }

    this.isProcessing = true;
    this.operation = 'subtract';

    try {
      await this.customerService.updateLoyaltyPoints(this.customer.id, this.pointsAmount, 'subtract');
      this.notificationService.showSuccess(`Se usaron ${this.pointsAmount} puntos`);
      this.pointsAmount = null;
      this.pointsUpdated.emit();
    } catch (error) {
      console.error('Error subtracting points:', error);
      this.notificationService.showError('Error al usar puntos');
    } finally {
      this.isProcessing = false;
      this.operation = null;
    }
  }

  getPointsValue(): number {
    return this.customer.loyaltyPoints * this.POINTS_TO_DOLLAR;
  }

  getDiscountValue(points: number): number {
    return points * this.POINTS_TO_DOLLAR;
  }

  getCurrentTier() {
    const totalSpent = this.customer.totalPurchases || 0;
    
    for (let i = this.loyaltyTiers.length - 1; i >= 0; i--) {
      if (totalSpent >= this.loyaltyTiers[i].minSpent) {
        return this.loyaltyTiers[i];
      }
    }
    
    return this.loyaltyTiers[0];
  }

  getNextTier() {
    const currentTier = this.getCurrentTier();
    const currentIndex = this.loyaltyTiers.findIndex(tier => tier.name === currentTier.name);
    
    if (currentIndex < this.loyaltyTiers.length - 1) {
      return this.loyaltyTiers[currentIndex + 1];
    }
    
    return null;
  }

  getTierProgress(): number {
    const currentTier = this.getCurrentTier();
    const nextTier = this.getNextTier();
    
    if (!nextTier) return 100;
    
    const totalSpent = this.customer.totalPurchases || 0;
    const tierRange = nextTier.minSpent - currentTier.minSpent;
    const progress = totalSpent - currentTier.minSpent;
    
    return Math.min(100, (progress / tierRange) * 100);
  }

  getNextTierMinSpent(): string {
    const nextTier = this.getNextTier();
    return nextTier ? (nextTier.minSpent.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })) : 'Máximo';
  }
}