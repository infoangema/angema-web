import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { FirebaseMetricsService, FirebaseMetrics, SessionMetrics, BusinessMetrics, OptimizationSuggestion } from '../../../../core/services/firebase-metrics.service';
import { CacheService } from '../../../../core/services/cache.service';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';

@Component({
  selector: 'app-firebase-monitoring',
  standalone: true,
  imports: [CommonModule, RouterModule, StockinNavbarComponent],
  template: `
    <stockin-navbar />
    
    <div class="container mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Firebase Monitoring Dashboard</h1>
        <div class="flex items-center gap-4">
          <button 
            (click)="refreshMetrics()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Actualizar
          </button>
          <button 
            (click)="clearAllCache()"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Limpiar Cache
          </button>
        </div>
      </div>

      @if (metrics) {
        <!-- Resumen General -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Lecturas Firebase</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ metrics.readsToday | number }}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Cache Hit Rate</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ metrics.cacheHitRate | number:'1.1-1' }}%</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Sesiones Activas</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ getTotalActiveSessions() }}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Sugerencias</dt>
                  <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ metrics.optimizationSuggestions.length }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Sugerencias de Optimización -->
        @if (metrics.optimizationSuggestions.length > 0) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              <svg class="w-5 h-5 inline-block mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              Sugerencias de Optimización
            </h2>
            <div class="space-y-4">
              @for (suggestion of metrics.optimizationSuggestions; track suggestion.title) {
                <div class="flex items-start p-4 rounded-lg" 
                     [ngClass]="{
                       'bg-red-50 border-l-4 border-red-400': suggestion.priority === 'high',
                       'bg-yellow-50 border-l-4 border-yellow-400': suggestion.priority === 'medium',
                       'bg-blue-50 border-l-4 border-blue-400': suggestion.priority === 'low'
                     }">
                  <div class="flex-shrink-0">
                    <svg class="w-5 h-5" [ngClass]="{
                           'text-red-400': suggestion.priority === 'high',
                           'text-yellow-400': suggestion.priority === 'medium',
                           'text-blue-400': suggestion.priority === 'low'
                         }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium" [ngClass]="{
                          'text-red-800': suggestion.priority === 'high',
                          'text-yellow-800': suggestion.priority === 'medium',
                          'text-blue-800': suggestion.priority === 'low'
                        }">
                      {{ suggestion.title }}
                    </h3>
                    <div class="mt-2 text-sm" [ngClass]="{
                           'text-red-700': suggestion.priority === 'high',
                           'text-yellow-700': suggestion.priority === 'medium',
                           'text-blue-700': suggestion.priority === 'low'
                         }">
                      <p>{{ suggestion.description }}</p>
                      <p class="mt-1 font-medium">Ahorro estimado: {{ suggestion.estimatedSavings }}%</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Estadísticas de Cache -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <svg class="w-5 h-5 inline-block mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
            </svg>
            Estadísticas de Cache
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ metrics.cacheStats.memoryEntries }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Memoria</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ metrics.cacheStats.localStorageEntries }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">LocalStorage</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-purple-600">{{ metrics.cacheStats.sessionStorageEntries }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">SessionStorage</div>
            </div>
          </div>
          <div class="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Tamaño total: {{ metrics.cacheStats.totalSize }} | 
            Tasa de aciertos: {{ metrics.cacheStats.hitRate | number:'1.1-1' }}% |
            Entradas expiradas: {{ metrics.cacheStats.expiredEntries }}
          </div>
        </div>

        <!-- Sesiones por Negocio -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <svg class="w-5 h-5 inline-block mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Control de Sesiones por Negocio
          </h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Negocio</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sesiones</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Última Actividad</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User Agents</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (session of metrics.activeSessions; track session.businessId) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {{ session.businessName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            [ngClass]="{
                              'bg-gray-100 text-gray-800': session.plan === 'basic',
                              'bg-yellow-100 text-yellow-800': session.plan === 'premium',
                              'bg-green-100 text-green-800': session.plan === 'enterprise'
                            }">
                        {{ session.plan | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span [ngClass]="{
                              'text-red-600': session.activeSessions > session.maxAllowed && session.maxAllowed !== -1,
                              'text-green-600': session.activeSessions <= session.maxAllowed || session.maxAllowed === -1
                            }">
                        {{ session.activeSessions }} / {{ session.maxAllowed === -1 ? '∞' : session.maxAllowed }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {{ session.lastActivity | date:'medium' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div class="max-w-xs truncate">
                        {{ session.userAgents.join(', ') }}
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Métricas por Negocio -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <svg class="w-5 h-5 inline-block mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Rendimiento por Negocio
          </h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Negocio</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lecturas Hoy</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cache Hit Rate</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tiempo Respuesta</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Colecciones + Accedidas</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (business of metrics.businessMetrics; track business.businessId) {
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {{ business.businessName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                            [ngClass]="{
                              'bg-gray-100 text-gray-800': business.plan === 'basic',
                              'bg-yellow-100 text-yellow-800': business.plan === 'premium',
                              'bg-green-100 text-green-800': business.plan === 'enterprise'
                            }">
                        {{ business.plan | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {{ business.readsToday | number }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span [ngClass]="{
                              'text-red-600': business.cacheHitRate < 50,
                              'text-yellow-600': business.cacheHitRate >= 50 && business.cacheHitRate < 70,
                              'text-green-600': business.cacheHitRate >= 70
                            }">
                        {{ business.cacheHitRate | number:'1.1-1' }}%
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span [ngClass]="{
                              'text-red-600': business.avgResponseTime > 2000,
                              'text-yellow-600': business.avgResponseTime > 1000 && business.avgResponseTime <= 2000,
                              'text-green-600': business.avgResponseTime <= 1000
                            }">
                        {{ business.avgResponseTime | number:'1.0-0' }}ms
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div class="max-w-xs">
                        @for (collection of business.mostAccessedCollections.slice(0, 3); track collection.collection) {
                          <div class="text-xs">{{ collection.collection }} ({{ collection.reads }})</div>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      } @else {
        <!-- Loading State -->
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      }
    </div>
  `,
  styleUrls: []
})
export class FirebaseMonitoringComponent implements OnInit, OnDestroy {
  metrics: FirebaseMetrics | null = null;
  private metricsSubscription?: Subscription;

  constructor(
    private firebaseMetricsService: FirebaseMetricsService,
    private cacheService: CacheService
  ) {}

  ngOnInit(): void {
    // Suscribirse a las métricas
    this.metricsSubscription = this.firebaseMetricsService.metrics$.subscribe(
      metrics => {
        this.metrics = metrics;
      }
    );

    // Forzar una actualización inicial
    this.refreshMetrics();
  }

  ngOnDestroy(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
  }

  async refreshMetrics(): Promise<void> {
    await this.firebaseMetricsService.refreshMetrics();
  }

  clearAllCache(): void {
    if (confirm('¿Está seguro de que desea limpiar todo el cache? Esto afectará el rendimiento temporalmente.')) {
      this.cacheService.clear();
      this.refreshMetrics();
    }
  }

  getTotalActiveSessions(): number {
    if (!this.metrics) return 0;
    return this.metrics.activeSessions.reduce((total, session) => total + session.activeSessions, 0);
  }
}