import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PageHeaderAction {
  label: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'indigo' | 'purple';
  action: () => void;
  condition?: boolean;
}

@Component({
  selector: 'stockin-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ title }}</h1>
          <p class="text-gray-600 mt-1">{{ subtitle }}</p>
        </div>

        <div class="flex gap-3">
          @for (action of actions; track action.label) {
            @if (action.condition !== false) {
              <button
                (click)="action.action()"
                [class]="getButtonClasses(action.color)"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.icon"></path>
                </svg>
                {{ action.label }}
              </button>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() actions: PageHeaderAction[] = [];

  getButtonClasses(color: string): string {
    const baseClasses = 'inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:ring-4 transition-colors';
    
    const colorClasses = {
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300',
      green: 'bg-green-600 hover:bg-green-700 focus:ring-green-300',
      red: 'bg-red-600 hover:bg-red-700 focus:ring-red-300',
      yellow: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-300',
      gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-300',
      purple: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-300'
    };

    return `${baseClasses} ${colorClasses[color as keyof typeof colorClasses]}`;
  }
}