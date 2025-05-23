import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare var bootstrap: any;

@Component({
  selector: 'app-presupuestos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './presupuestos.component.html',
  styleUrls: ['./presupuestos.component.css']
})
export class PresupuestosComponent implements OnInit {

  passwordResumen: string = '';
  passwordPlanificacion: string = '';
  errorResumen: boolean = false;
  errorPlanificacion: boolean = false;

  private modalResumen: any;
  private modalPlanificacion: any;

  private readonly PASSWORD_RESUMEN = 'Cliente052025..';
  private readonly PASSWORD_PLANIFICACION = 'Nacho052025..';

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Inicializar modales de Bootstrap 5 después de que la vista se cargue
    setTimeout(() => {
      this.initializeModals();
    }, 100);
  }

  private initializeModals(): void {
    try {
      if (typeof bootstrap !== 'undefined') {
        const modalResumenElement = document.getElementById('modalResumen');
        const modalPlanificacionElement = document.getElementById('modalPlanificacion');
        
        if (modalResumenElement) {
          this.modalResumen = new bootstrap.Modal(modalResumenElement);
        }
        
        if (modalPlanificacionElement) {
          this.modalPlanificacion = new bootstrap.Modal(modalPlanificacionElement);
        }
      }
    } catch (error) {
      console.log('Bootstrap no disponible, usando implementación alternativa');
    }
  }

  abrirModalResumen(): void {
    console.log('Intentando abrir modal resumen...');
    this.passwordResumen = '';
    this.errorResumen = false;
    
    try {
      if (this.modalResumen) {
        console.log('Usando Bootstrap modal API');
        this.modalResumen.show();
      } else {
        console.log('Usando implementación manual');
        // Fallback manual
        this.showModalManually('modalResumen');
      }
    } catch (error) {
      console.log('Error con Bootstrap, usando manual:', error);
      this.showModalManually('modalResumen');
    }
  }

  abrirModalPlanificacion(): void {
    console.log('Intentando abrir modal planificación...');
    this.passwordPlanificacion = '';
    this.errorPlanificacion = false;
    
    try {
      if (this.modalPlanificacion) {
        console.log('Usando Bootstrap modal API');
        this.modalPlanificacion.show();
      } else {
        console.log('Usando implementación manual');
        // Fallback manual
        this.showModalManually('modalPlanificacion');
      }
    } catch (error) {
      console.log('Error con Bootstrap, usando manual:', error);
      this.showModalManually('modalPlanificacion');
    }
  }

  private showModalManually(modalId: string): void {
    console.log('Mostrando modal manualmente:', modalId);
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      console.log('Elemento modal encontrado');
      // Mostrar modal
      modalElement.classList.add('show');
      modalElement.style.display = 'block';
      modalElement.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');
      
      // Crear y mostrar backdrop
      let backdrop = document.querySelector('.modal-backdrop');
      if (!backdrop) {
        console.log('Creando backdrop');
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
      
      // Agregar clase al body
      document.body.classList.add('modal-open');
      
      // Enfocar el modal
      modalElement.focus();
      console.log('Modal mostrado manualmente');
    } else {
      console.log('Elemento modal NO encontrado:', modalId);
    }
  }

  cerrarModal(modalId: string): void {
    try {
      if (modalId === 'modalResumen' && this.modalResumen) {
        this.modalResumen.hide();
      } else if (modalId === 'modalPlanificacion' && this.modalPlanificacion) {
        this.modalPlanificacion.hide();
      } else {
        this.hideModalManually(modalId);
      }
    } catch (error) {
      this.hideModalManually(modalId);
    }
  }

  private hideModalManually(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      // Ocultar modal
      modalElement.classList.remove('show');
      modalElement.style.display = 'none';
      modalElement.setAttribute('aria-hidden', 'true');
      modalElement.removeAttribute('aria-modal');
      
      // Remover backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      
      // Remover clase del body
      document.body.classList.remove('modal-open');
    }
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
    }
  }
} 