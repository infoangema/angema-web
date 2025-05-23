import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.css']
})
export class PresupuestosComponent implements OnInit, AfterViewInit {

  passwordResumen: string = '';
  passwordPlanificacion: string = '';
  errorResumen: boolean = false;
  errorPlanificacion: boolean = false;

  private readonly PASSWORD_RESUMEN = 'Cliente052025..';
  private readonly PASSWORD_PLANIFICACION = 'Nacho052025..';

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Inicialización básica
  }

  ngAfterViewInit(): void {
    // Verificar que los modales estén disponibles
    setTimeout(() => {
      const modalResumen = document.getElementById('modalResumen');
      const modalPlanificacion = document.getElementById('modalPlanificacion');
      
      console.log('Modal Resumen encontrado:', !!modalResumen);
      console.log('Modal Planificación encontrado:', !!modalPlanificacion);
      
      if (!modalResumen || !modalPlanificacion) {
        console.error('Uno o más modales no fueron encontrados en el DOM');
      } else {
        console.log('Todos los modales están disponibles');
      }
    }, 100);
  }

  abrirModalResumen(): void {
    console.log('Abriendo modal resumen...');
    this.passwordResumen = '';
    this.errorResumen = false;
    
    // Intentar método principal
    this.showModal('modalResumen');
    
    // Verificar si se mostró correctamente
    setTimeout(() => {
      const modal = document.getElementById('modalResumen');
      if (modal && !modal.classList.contains('show')) {
        console.log('Método principal falló, usando método alternativo');
        this.showModalAlternative('modalResumen');
      }
    }, 200);
  }

  abrirModalPlanificacion(): void {
    console.log('Abriendo modal planificación...');
    this.passwordPlanificacion = '';
    this.errorPlanificacion = false;
    
    // Intentar método principal
    this.showModal('modalPlanificacion');
    
    // Verificar si se mostró correctamente
    setTimeout(() => {
      const modal = document.getElementById('modalPlanificacion');
      if (modal && !modal.classList.contains('show')) {
        console.log('Método principal falló, usando método alternativo');
        this.showModalAlternative('modalPlanificacion');
      }
    }, 200);
  }

  private showModal(modalId: string): void {
    console.log('Intentando mostrar modal:', modalId);
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      console.log('Elemento modal encontrado:', modalElement);
      
      // Remover cualquier backdrop existente primero
      this.removeBackdrop();
      
      // Mostrar modal
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.style.opacity = '1';
      modalElement.style.visibility = 'visible';
      modalElement.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');
      
      // Crear backdrop
      this.createBackdrop();
      
      // Agregar clase al body
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      console.log('Modal mostrado, clases aplicadas');
      
      // Enfocar el input de password
      setTimeout(() => {
        const passwordInput = modalElement.querySelector('input[type="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
          console.log('Input enfocado');
        }
      }, 150);
    } else {
      console.error('Elemento modal NO encontrado:', modalId);
    }
  }

  private createBackdrop(): void {
    // Remover backdrop existente
    const existingBackdrop = document.querySelector('.modal-backdrop');
    if (existingBackdrop) {
      existingBackdrop.remove();
    }
    
    // Crear nuevo backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.style.zIndex = '1040';
    document.body.appendChild(backdrop);
    
    // Cerrar modal al hacer clic en backdrop
    backdrop.addEventListener('click', () => {
      this.cerrarTodosLosModales();
    });
  }

  cerrarModal(modalId: string): void {
    console.log('Cerrando modal:', modalId);
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.style.opacity = '0';
      modalElement.style.visibility = 'hidden';
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      console.log('Modal cerrado');
    }
    this.removeBackdrop();
  }

  private cerrarTodosLosModales(): void {
    const modales = ['modalResumen', 'modalPlanificacion'];
    modales.forEach(modalId => {
      const modalElement = document.getElementById(modalId);
      if (modalElement && modalElement.classList.contains('show')) {
        this.cerrarModal(modalId);
      }
    });
  }

  private removeBackdrop(): void {
    console.log('Removiendo backdrop...');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove();
      console.log('Backdrop removido');
    }
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    console.log('Clases del body limpiadas');
  }

  verificarPasswordResumen(): void {
    if (this.passwordResumen === this.PASSWORD_RESUMEN) {
      this.cerrarModal('modalResumen');
      setTimeout(() => {
        this.router.navigate(['/presupuesto-resumen']);
      }, 300);
    } else {
      this.errorResumen = true;
      this.passwordResumen = '';
      setTimeout(() => {
        const input = document.getElementById('passwordResumen') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  verificarPasswordPlanificacion(): void {
    if (this.passwordPlanificacion === this.PASSWORD_PLANIFICACION) {
      this.cerrarModal('modalPlanificacion');
      setTimeout(() => {
        this.router.navigate(['/presupuesto-planificacion']);
      }, 300);
    } else {
      this.errorPlanificacion = true;
      this.passwordPlanificacion = '';
      setTimeout(() => {
        const input = document.getElementById('passwordPlanificacion') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }

  private showModalAlternative(modalId: string): void {
    console.log('Usando método alternativo para:', modalId);
    const modalElement = document.getElementById(modalId);
    
    if (modalElement) {
      // Limpiar estado previo
      this.removeBackdrop();
      
      // Aplicar estilos directamente
      modalElement.style.display = 'block';
      modalElement.style.opacity = '1';
      modalElement.style.visibility = 'visible';
      modalElement.style.position = 'fixed';
      modalElement.style.top = '0';
      modalElement.style.left = '0';
      modalElement.style.width = '100%';
      modalElement.style.height = '100%';
      modalElement.style.zIndex = '1055';
      modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
      
      modalElement.classList.add('show');
      modalElement.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');
      
      // Centrar el diálogo
      const dialog = modalElement.querySelector('.modal-dialog') as HTMLElement;
      if (dialog) {
        dialog.style.position = 'relative';
        dialog.style.top = '50%';
        dialog.style.transform = 'translateY(-50%)';
        dialog.style.margin = '0 auto';
        dialog.style.maxWidth = '500px';
      }
      
      // Agregar clase al body
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      
      console.log('Modal alternativo mostrado');
      
      // Enfocar input
      setTimeout(() => {
        const passwordInput = modalElement.querySelector('input[type="password"]') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
    }
  }
} 