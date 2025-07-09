import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { BusinessService } from '../../../../core/services/business.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Business, CreateBusinessRequest, User, CreateUserRequest } from '../../../../core/models/business.model';
import { UserSession } from '../../../../core/models/user-session.model';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';

@Component({
  selector: 'app-root-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, StockinNavbarComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-[90rem] mx-auto px-8">
          <div class="flex justify-between items-center py-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Panel de Administración Root</h1>
              <p class="mt-1 text-sm text-gray-600">Gestión de negocios y usuarios del sistema</p>
            </div>
            <div class="flex space-x-3">
              <button
                data-modal-target="business-modal"
                data-modal-toggle="business-modal"
                (click)="showCreateBusinessModal = true"
                class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                type="button"
              >
                <span class="flex items-center">
                  <svg class="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
                  Crear Negocio
                </span>
              </button>
              <button
                (click)="showCreateUserModal = true"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-[90rem] mx-auto px-8 py-8">
        <!-- Tabs -->
        <div class="border-b border-gray-200 mb-8">
          <nav class="-mb-px flex space-x-8">
            <button
              (click)="activeTab = 'businesses'"
              [class]="activeTab === 'businesses' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Negocios ({{ businesses.length }})
            </button>
            <button
              (click)="activeTab = 'users'"
              [class]="activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              Usuarios ({{ users.length }})
            </button>
          </nav>
        </div>

        <!-- Businesses Tab -->
        <div *ngIf="activeTab === 'businesses'" class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Negocios Registrados</h3>
            </div>
            <div class="p-6">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Negocio</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr *ngFor="let business of businesses">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ business.name }}</div>
                          <div class="text-sm text-gray-500">{{ business.address }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div class="text-sm text-gray-900">{{ business.email }}</div>
                          <div class="text-sm text-gray-500">{{ business.phone }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span [class]="getPlanBadgeClass(business.plan)" class="px-2 py-1 text-xs font-semibold rounded-full">
                          {{ getPlanName(business.plan) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span [class]="business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                              class="px-2 py-1 text-xs font-semibold rounded-full">
                          {{ business.isActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ business.createdAt | date:'short' }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          (click)="toggleBusinessStatus(business)"
                          [class]="business.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                        >
                          {{ business.isActive ? 'Desactivar' : 'Activar' }}
                        </button>
                        <button 
                          (click)="editBusiness(business)"
                          class="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div *ngIf="activeTab === 'users'" class="space-y-6">
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div class="flex items-center justify-between flex-column flex-wrap md:flex-row space-y-4 md:space-y-0 pb-4 bg-white">
              <div>
                <button 
                  (click)="showBulkActions = !showBulkActions"
                  class="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5" 
                  type="button"
                >
                  <span class="sr-only">Action button</span>
                  Acciones
                  <svg class="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>
                <!-- Dropdown menu -->
                <div *ngIf="showBulkActions" class="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 mt-2">
                  <ul class="py-1 text-sm text-gray-700">
                    <li>
                      <button (click)="activateSelectedUsers()" class="block w-full text-left px-4 py-2 hover:bg-gray-100">Activar seleccionados</button>
                    </li>
                    <li>
                      <button (click)="deactivateSelectedUsers()" class="block w-full text-left px-4 py-2 hover:bg-gray-100">Desactivar seleccionados</button>
                    </li>
                  </ul>
                  <div class="py-1">
                    <button (click)="deleteSelectedUsers()" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Eliminar usuarios</button>
                  </div>
                </div>
              </div>
              <label for="table-search" class="sr-only">Buscar</label>
              <div class="relative">
                <div class="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                  </svg>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="userSearchTerm"
                  (input)="filterUsers()"
                  class="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Buscar usuarios..."
                >
              </div>
            </div>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" class="p-4">
                    <div class="flex items-center">
                      <input 
                        id="checkbox-all-search" 
                        type="checkbox" 
                        [(ngModel)]="allUsersSelected"
                        (change)="toggleAllUsers()"
                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      >
                      <label for="checkbox-all-search" class="sr-only">checkbox</label>
                    </div>
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Usuario
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Negocio
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Rol
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Último acceso
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  *ngFor="let user of filteredUsers; let i = index" 
                  class="bg-white border-b border-gray-200 hover:bg-gray-50"
                >
                  <td class="w-4 p-4">
                    <div class="flex items-center">
                      <input 
                        [id]="'checkbox-table-search-' + i" 
                        type="checkbox" 
                        [(ngModel)]="user.selected"
                        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      >
                      <label [for]="'checkbox-table-search-' + i" class="sr-only">checkbox</label>
                    </div>
                  </td>
                  <th scope="row" class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                      {{ getUserInitials(user.displayName) }}
                    </div>
                    <div class="ps-3">
                      <div class="text-base font-semibold">{{ user.displayName }}</div>
                      <div class="font-normal text-gray-500">{{ user.email }}</div>
                    </div>  
                  </th>
                  <td class="px-6 py-4">
                    {{ getBusinessName(user.businessId) }}
                  </td>
                  <td class="px-6 py-4">
                    <span [class]="getRoleBadgeClass(user.roleId)" class="px-2 py-1 text-xs font-semibold rounded-full">
                      {{ getRoleName(user.roleId) }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div [class]="user.isActive ? 'h-2.5 w-2.5 rounded-full bg-green-500 me-2' : 'h-2.5 w-2.5 rounded-full bg-red-500 me-2'"></div>
                      {{ user.isActive ? 'Activo' : 'Inactivo' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-gray-500">
                    {{ user.lastLogin ? (user.lastLogin | date:'short') : 'Nunca' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex space-x-2">
                      <button 
                        (click)="toggleUserStatus(user)"
                        [class]="user.isActive ? 'font-medium text-red-600 hover:underline' : 'font-medium text-green-600 hover:underline'"
                      >
                        {{ user.isActive ? 'Desactivar' : 'Activar' }}
                      </button>
                      <span class="text-gray-300">|</span>
                      <button 
                        (click)="editUser(user)"
                        class="font-medium text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create Business Modal -->
      <div id="business-modal" [class.hidden]="!showCreateBusinessModal" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        <div class="relative p-4 w-full max-w-4xl max-h-full">
          <!-- Modal content -->
          <div class="relative bg-white rounded-lg shadow-lg">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 class="text-lg font-semibold text-gray-900">
                Crear Nuevo Negocio
              </h3>
              <button 
                type="button" 
                (click)="showCreateBusinessModal = false"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span class="sr-only">Cerrar modal</span>
              </button>
            </div>
            <!-- Modal body -->
            <form class="p-4 md:p-5" [formGroup]="businessForm" (ngSubmit)="createBusiness()">
              <div class="grid gap-4 mb-4">
                <div class="col-span-2">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Nombre del Negocio</label>
                  <input
                    type="text"
                    formControlName="name"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Ej: Mi Tienda S.A."
                  >
                </div>
                
                <div class="col-span-2">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Email del Negocio</label>
                  <input
                    type="email"
                    formControlName="email"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="contacto@mitienda.com"
                  >
                </div>
                
                <div class="col-span-2 sm:col-span-1">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Teléfono</label>
                  <input
                    type="tel"
                    formControlName="phone"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="+54 11 1234 5678"
                  >
                </div>
                
                <div class="col-span-2 sm:col-span-1">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Plan</label>
                  <select
                    formControlName="plan"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div class="col-span-2">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Dirección</label>
                  <input
                    type="text"
                    formControlName="address"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Calle Principal 123, Ciudad"
                  >
                </div>
                
                <div class="col-span-2 border-t pt-4">
                  <h4 class="text-md font-medium text-gray-900 mb-3">Usuario Administrador</h4>
                  
                  <div class="grid gap-4">
                    <div class="col-span-2">
                      <label class="block mb-2 text-sm font-medium text-gray-900">Email del Admin</label>
                      <input
                        type="email"
                        formControlName="adminEmail"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder="admin@mitienda.com"
                      >
                    </div>
                    
                    <div class="col-span-2">
                      <label class="block mb-2 text-sm font-medium text-gray-900">Nombre del Admin</label>
                      <input
                        type="text"
                        formControlName="adminName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder="Juan Pérez"
                      >
                    </div>
                    
                    <div class="col-span-2">
                      <label class="block mb-2 text-sm font-medium text-gray-900">Contraseña</label>
                      <input
                        type="password"
                        formControlName="adminPassword"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder="Contraseña segura"
                      >
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  (click)="showCreateBusinessModal = false"
                  class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="businessForm.invalid || loading"
                  class="text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  <svg *ngIf="loading" class="me-1 -ms-1 w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg *ngIf="!loading" class="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
                  </svg>
                  {{ loading ? 'Creando...' : 'Crear Negocio' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Create User Modal -->
      <div id="user-modal" [class.hidden]="!showCreateUserModal" class="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        <div class="relative p-4 w-full max-w-4xl max-h-full">
          <!-- Modal content -->
          <div class="relative bg-white rounded-lg shadow-lg">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
              <h3 class="text-lg font-semibold text-gray-900">
                Crear Nuevo Usuario
              </h3>
              <button 
                type="button" 
                (click)="showCreateUserModal = false"
                class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span class="sr-only">Cerrar modal</span>
              </button>
            </div>
            <!-- Modal body -->
            <form class="p-4 md:p-5" [formGroup]="userForm" (ngSubmit)="createUser()">
              <div class="grid gap-4 mb-4">
                <div class="col-span-2">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Email</label>
                  <input
                    type="email"
                    formControlName="email"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="usuario@email.com"
                  >
                </div>
                
                <div class="col-span-2">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Nombre completo</label>
                  <input
                    type="text"
                    formControlName="displayName"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Juan Pérez"
                  >
                </div>
                
                <div class="col-span-2">
                  <p class="text-sm text-gray-600">
                    Se enviará un email de invitación al usuario para que establezca su contraseña.
                  </p>
                </div>
                
                <div class="col-span-2 sm:col-span-1">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Negocio</label>
                  <select
                    formControlName="businessId"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  >
                    <option value="">Sin negocio asignado</option>
                    <option *ngFor="let business of businesses" [value]="business.id">
                      {{ business.name }}
                    </option>
                  </select>
                </div>
                
                <div class="col-span-2 sm:col-span-1">
                  <label class="block mb-2 text-sm font-medium text-gray-900">Rol</label>
                  <select
                    formControlName="roleId"
                    class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
                  >
                    <option *ngFor="let role of availableRoles" [value]="role.id">
                      {{ role.name }} - {{ role.description }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  (click)="showCreateUserModal = false"
                  class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="userForm.invalid || loading"
                  class="text-white inline-flex items-center bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  <svg *ngIf="loading" class="me-1 -ms-1 w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg *ngIf="!loading" class="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path>
                  </svg>
                  {{ loading ? 'Creando...' : 'Crear Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class RootAdminComponent implements OnInit, OnDestroy {
  activeTab: 'businesses' | 'users' = 'businesses';
  businesses: Business[] = [];
  users: User[] = [];
  filteredUsers: (User & { selected?: boolean })[] = [];
  availableRoles: any[] = [];
  availablePlans: any[] = [];
  
  businessForm: FormGroup;
  userForm: FormGroup;
  
  showCreateBusinessModal = false;
  showCreateUserModal = false;
  showBulkActions = false;
  loading = false;
  
  // Search and selection
  userSearchTerm = '';
  allUsersSelected = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private businessService: BusinessService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.businessForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      plan: ['basic', [Validators.required]],
      adminEmail: ['', [Validators.required, Validators.email]],
      adminName: ['', [Validators.required]],
      adminPassword: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', [Validators.required]],
      businessId: [''],
      roleId: ['admin', [Validators.required]]
    });
  }

  ngOnInit() {
    // Verificar que el usuario sea Root
    if (!this.authService.isRoot()) {
      this.notificationService.error('Acceso denegado. Solo usuarios Root pueden acceder a esta sección.');
      return;
    }

    this.loadData();
    this.availableRoles = this.businessService.getAvailableRoles();
    this.availablePlans = this.businessService.getAvailablePlans();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadData() {
    // Cargar negocios
    const businessSub = this.businessService.getBusinesses().subscribe({
      next: (businesses) => {
        this.businesses = businesses;
      },
      error: (error) => {
        console.error('Error cargando negocios:', error);
        this.notificationService.error('Error cargando negocios');
      }
    });
    this.subscriptions.push(businessSub);

    // Cargar usuarios
    const userSub = this.businessService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users.map(user => ({ ...user, selected: false }));
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.notificationService.error('Error cargando usuarios');
      }
    });
    this.subscriptions.push(userSub);
  }

  async createBusiness() {
    if (this.businessForm.invalid) return;

    this.loading = true;
    try {
      const formValue = this.businessForm.value;
      const request: CreateBusinessRequest = {
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        address: formValue.address,
        plan: formValue.plan,
        adminUser: {
          email: formValue.adminEmail,
          displayName: formValue.adminName,
          password: formValue.adminPassword
        }
      };

      await this.businessService.createBusiness(request);
      this.notificationService.success('Negocio creado exitosamente');
      this.showCreateBusinessModal = false;
      this.businessForm.reset({ plan: 'basic' });
    } catch (error: any) {
      console.error('Error creando negocio:', error);
      this.notificationService.error('Error creando negocio: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loading = false;
    }
  }

  async createUser() {
    if (this.userForm.invalid) return;

    this.loading = true;
    try {
      const formValue = this.userForm.value;
      const userData: Partial<UserSession> = {
        email: formValue.email,
        displayName: formValue.displayName,
        businessId: formValue.businessId || undefined,
        roleId: formValue.roleId,
        isActive: true
      };

      await this.authService.createUserWithMagicLink(formValue.email, userData);
      this.notificationService.success('Usuario creado exitosamente. Se ha enviado un email de invitación.');
      this.showCreateUserModal = false;
      this.userForm.reset({ roleId: 'admin' });
      await this.loadData(); // Recargar la lista de usuarios
    } catch (error: any) {
      console.error('Error creando usuario:', error);
      this.notificationService.error('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loading = false;
    }
  }

  async toggleBusinessStatus(business: Business) {
    try {
      await this.businessService.updateBusiness(business.id!, { isActive: !business.isActive });
      this.notificationService.success(`Negocio ${business.isActive ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado del negocio:', error);
      this.notificationService.error('Error actualizando estado del negocio');
    }
  }

  async toggleUserStatus(user: User) {
    try {
      await this.businessService.updateUser(user.id!, { isActive: !user.isActive });
      this.notificationService.success(`Usuario ${user.isActive ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado del usuario:', error);
      this.notificationService.error('Error actualizando estado del usuario');
    }
  }

  editBusiness(business: Business) {
    // TODO: Implementar edición de negocio
    this.notificationService.info('Funcionalidad de edición próximamente');
  }

  editUser(user: User) {
    // TODO: Implementar edición de usuario
    this.notificationService.info('Funcionalidad de edición próximamente');
  }

  getBusinessName(businessId?: string): string {
    if (!businessId) return 'Sin negocio';
    const business = this.businesses.find(b => b.id === businessId);
    return business?.name || 'Negocio no encontrado';
  }

  getPlanName(plan: string): string {
    const planObj = this.availablePlans.find(p => p.id === plan);
    return planObj?.name || plan;
  }

  getRoleName(roleId: string): string {
    const role = this.availableRoles.find(r => r.id === roleId);
    return role?.name || roleId;
  }

  getPlanBadgeClass(plan: string): string {
    switch (plan) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getRoleBadgeClass(roleId: string): string {
    switch (roleId) {
      case 'root': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'vendedor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Métodos para búsqueda y filtrado
  filterUsers() {
    if (!this.userSearchTerm.trim()) {
      this.filteredUsers = this.users.map(user => ({ ...user, selected: false }));
    } else {
      this.filteredUsers = this.users
        .filter(user => 
          user.displayName.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
          this.getBusinessName(user.businessId).toLowerCase().includes(this.userSearchTerm.toLowerCase()) ||
          this.getRoleName(user.roleId).toLowerCase().includes(this.userSearchTerm.toLowerCase())
        )
        .map(user => ({ ...user, selected: false }));
    }
    this.allUsersSelected = false;
  }

  // Métodos para selección múltiple
  toggleAllUsers() {
    this.filteredUsers.forEach(user => user.selected = this.allUsersSelected);
  }

  getUserInitials(displayName: string): string {
    if (!displayName) return 'U';
    const names = displayName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  // Acciones masivas
  async activateSelectedUsers() {
    const selectedUsers = this.filteredUsers.filter(user => user.selected && !user.isActive);
    if (selectedUsers.length === 0) {
      this.notificationService.warning('No hay usuarios inactivos seleccionados');
      return;
    }

    try {
      for (const user of selectedUsers) {
        await this.businessService.updateUser(user.id!, { isActive: true });
      }
      this.notificationService.success(`${selectedUsers.length} usuarios activados exitosamente`);
      this.showBulkActions = false;
    } catch (error) {
      this.notificationService.error('Error activando usuarios');
    }
  }

  async deactivateSelectedUsers() {
    const selectedUsers = this.filteredUsers.filter(user => user.selected && user.isActive);
    if (selectedUsers.length === 0) {
      this.notificationService.warning('No hay usuarios activos seleccionados');
      return;
    }

    try {
      for (const user of selectedUsers) {
        await this.businessService.updateUser(user.id!, { isActive: false });
      }
      this.notificationService.success(`${selectedUsers.length} usuarios desactivados exitosamente`);
      this.showBulkActions = false;
    } catch (error) {
      this.notificationService.error('Error desactivando usuarios');
    }
  }

  async deleteSelectedUsers() {
    const selectedUsers = this.filteredUsers.filter(user => user.selected);
    if (selectedUsers.length === 0) {
      this.notificationService.warning('No hay usuarios seleccionados');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar ${selectedUsers.length} usuarios? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;

    try {
      for (const user of selectedUsers) {
        await this.businessService.deleteUser(user.id!);
      }
      this.notificationService.success(`${selectedUsers.length} usuarios eliminados exitosamente`);
      this.showBulkActions = false;
    } catch (error) {
      this.notificationService.error('Error eliminando usuarios');
    }
  }
} 