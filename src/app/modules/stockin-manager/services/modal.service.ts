import { Injectable, ComponentRef, ViewContainerRef } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private closeModalSubject = new Subject<void>();
  private productCreatedSubject = new Subject<void>();
  private categoryCreatedSubject = new Subject<void>();
  private warehouseCreatedSubject = new Subject<void>();
  private modalStateSubject = new BehaviorSubject<{ isOpen: boolean, component?: any, data?: any }>({ isOpen: false });

  closeModal$ = this.closeModalSubject.asObservable();
  productCreated$ = this.productCreatedSubject.asObservable();
  categoryCreated$ = this.categoryCreatedSubject.asObservable();
  warehouseCreated$ = this.warehouseCreatedSubject.asObservable();
  modalState$ = this.modalStateSubject.asObservable();

  private modalContainer?: ViewContainerRef;
  private activeModal?: ComponentRef<any>;

  setModalContainer(container: ViewContainerRef) {
    this.modalContainer = container;
  }

  async open(component: any, data?: any): Promise<boolean> {
    if (!this.modalContainer) {
      console.error('Modal container not set');
      return false;
    }

    // Clear existing modal
    if (this.activeModal) {
      this.activeModal.destroy();
    }

    // Create new modal
    this.activeModal = this.modalContainer.createComponent(component);
    
    // Pass data if provided
    if (data && this.activeModal.instance) {
      Object.assign(this.activeModal.instance, data);
    }

    // Update modal state
    this.modalStateSubject.next({ isOpen: true, component, data });

    return new Promise((resolve) => {
      const closeSubscription = this.closeModal$.subscribe(() => {
        resolve(true);
        closeSubscription.unsubscribe();
      });
    });
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = undefined;
    }
    this.modalStateSubject.next({ isOpen: false });
    this.closeModalSubject.next();
  }

  productCreated(): void {
    this.productCreatedSubject.next();
  }

  categoryCreated(): void {
    this.categoryCreatedSubject.next();
  }

  warehouseCreated(): void {
    this.warehouseCreatedSubject.next();
  }
} 