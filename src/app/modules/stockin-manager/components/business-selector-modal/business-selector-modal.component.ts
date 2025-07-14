import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { BusinessService } from '../../../../core/services/business.service';
import { Business } from '../../../../core/models/business.model';
import { SessionStorageService } from '../../../../core/services/session-storage.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RootBusinessSelectorService } from '../../services/root-business-selector.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-business-selector-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business-selector-modal.component.html',
  styleUrls: ['./business-selector-modal.component.css']
})
export class BusinessSelectorModalComponent implements OnInit {
  @Output() modalClose = new EventEmitter<void>();
  
  businesses$!: Observable<Business[]>;
  selectedBusinessId: string | null = null;
  showAllSelected = false;

  constructor(
    private businessService: BusinessService,
    private sessionStorage: SessionStorageService,
    private notificationService: NotificationService,
    private rootBusinessSelector: RootBusinessSelectorService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.businesses$ = this.businessService.getBusinesses();
    
    // Cargar selección actual del servicio de RootBusinessSelector
    const currentSelection = this.rootBusinessSelector.getCurrentSelection();
    this.selectedBusinessId = currentSelection.businessId;
    this.showAllSelected = currentSelection.showAll;
    
    // DO NOT auto-select "show all" - force user to make an explicit choice
    // This ensures the business selection is intentional
  }

  trackByBusinessId(index: number, business: Business): string {
    return business.id || index.toString();
  }

  selectBusiness(businessId: string): void {
    this.selectedBusinessId = businessId;
    this.showAllSelected = false;
  }

  clearSelection(): void {
    console.log('BusinessSelector: clearSelection() llamado');
    this.selectedBusinessId = null;
    this.showAllSelected = true;
    console.log('BusinessSelector: después de clearSelection - selectedBusinessId:', this.selectedBusinessId, 'showAllSelected:', this.showAllSelected);
  }

  confirmSelection(): void {
    console.log('BusinessSelector: confirmSelection() llamado');
    console.log('BusinessSelector: selectedBusinessId:', this.selectedBusinessId);
    console.log('BusinessSelector: showAllSelected:', this.showAllSelected);
    
    // Validate that a selection has been made
    const hasBusinessId = !!this.selectedBusinessId;
    const hasShowAll = this.showAllSelected;
    console.log('BusinessSelector: hasBusinessId:', hasBusinessId, 'hasShowAll:', hasShowAll);
    
    if (!hasShowAll && !hasBusinessId) {
      console.log('BusinessSelector: No hay selección válida');
      this.notificationService.showError('Por favor, selecciona un negocio o elige "Ver Todos"');
      return;
    }
    
    console.log('BusinessSelector: Guardando selección...');
    // Usar el servicio de RootBusinessSelector para guardar la selección
    this.rootBusinessSelector.setBusinessSelection(this.selectedBusinessId, this.showAllSelected);
    
    const message = this.showAllSelected 
      ? 'Visualizando todos los negocios'
      : `Negocio seleccionado correctamente`;
    
    console.log('BusinessSelector: Mostrando notificación y cerrando modal');
    this.notificationService.showSuccess(message);
    this.closeModal();
  }

  closeModal(): void {
    console.log('BusinessSelector: closeModal() llamado');
    
    // Emitir evento para modales que usan binding directo (como login)
    console.log('BusinessSelector: Emitiendo evento modalClose');
    this.modalClose.emit();
    
    // También usar el ModalService para modales dinámicos (como navbar)
    try {
      console.log('BusinessSelector: Intentando cerrar con ModalService');
      this.modalService.closeModal();
    } catch (error) {
      // El ModalService puede no estar configurado en algunos contextos (como login)
      console.log('ModalService not available, using direct event emission');
    }
  }
}