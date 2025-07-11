import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { BusinessService } from '../../../../core/services/business.service';
import { Business } from '../../../../core/models/business.model';
import { SessionStorageService } from '../../../../core/services/session-storage.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RootBusinessSelectorService } from '../../services/root-business-selector.service';

@Component({
  selector: 'app-business-selector-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business-selector-modal.component.html',
  styleUrls: ['./business-selector-modal.component.css']
})
export class BusinessSelectorModalComponent implements OnInit {
  @Output() modalClosed = new EventEmitter<void>();
  
  businesses$!: Observable<Business[]>;
  selectedBusinessId: string | null = null;
  showAllSelected = false;

  constructor(
    private businessService: BusinessService,
    private sessionStorage: SessionStorageService,
    private notificationService: NotificationService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  ngOnInit(): void {
    this.businesses$ = this.businessService.getBusinesses();
    
    // Cargar selección actual del servicio de RootBusinessSelector
    const currentSelection = this.rootBusinessSelector.getCurrentSelection();
    console.log('=== BUSINESS SELECTOR MODAL INIT ===');
    console.log('Current selection:', currentSelection);
    
    this.selectedBusinessId = currentSelection.businessId;
    this.showAllSelected = currentSelection.showAll;
    
    // Si no hay selección válida, por defecto mostrar "Ver Todos"
    if (!currentSelection.showAll && !currentSelection.businessId) {
      this.showAllSelected = true;
    }
  }

  trackByBusinessId(index: number, business: Business): string {
    return business.id || index.toString();
  }

  selectBusiness(businessId: string): void {
    this.selectedBusinessId = businessId;
    this.showAllSelected = false;
  }

  clearSelection(): void {
    this.selectedBusinessId = null;
    this.showAllSelected = true;
  }

  confirmSelection(): void {
    // Usar el servicio de RootBusinessSelector para guardar la selección
    this.rootBusinessSelector.setBusinessSelection(this.selectedBusinessId, this.showAllSelected);
    
    const message = this.showAllSelected 
      ? 'Visualizando todos los negocios'
      : `Negocio seleccionado correctamente`;
    
    this.notificationService.success(message);
    this.closeModal();
  }

  closeModal(): void {
    this.modalClosed.emit();
  }
}