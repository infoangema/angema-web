import { Injectable } from '@angular/core';
import { Firestore, collection, doc, query, where, orderBy, getDocs, addDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Warehouse, WarehouseLocation } from '../models/warehouse.model';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private readonly COLLECTION_NAME = 'warehouses';
  private warehousesSubject = new BehaviorSubject<Warehouse[]>([]);
  warehouses$ = this.warehousesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private businessService: BusinessService,
    private authService: AuthService
  ) {}

  // CRUD básico
  async createWarehouse(warehouse: Omit<Warehouse, 'id'>): Promise<string> {
    const businessId = await this.businessService.getCurrentBusinessId();
    if (!businessId && !this.authService.isRoot()) {
      throw new Error('No business ID available for warehouse creation');
    }
    const warehouseWithBusiness = { ...warehouse, businessId: businessId || '' };
    const docRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), warehouseWithBusiness);
    return docRef.id;
  }

  async updateWarehouse(id: string, warehouse: Partial<Warehouse>): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
    await updateDoc(docRef, warehouse);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
    await updateDoc(docRef, { isActive: false });
  }

  // Consultas
  async getWarehouses(): Promise<Warehouse[]> {
    const isRoot = this.authService.isRoot();
    const businessId = await this.businessService.getCurrentBusinessId();
    
    let q;
    if (isRoot) {
      // Root users see all warehouses from all businesses
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else if (businessId) {
      // Regular users see only their business warehouses
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('businessId', '==', businessId),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else {
      // No business ID and not root - return empty array
      this.warehousesSubject.next([]);
      return [];
    }

    const snapshot = await getDocs(q);
    const warehouses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Warehouse);
    this.warehousesSubject.next(warehouses);
    return warehouses;
  }

  watchWarehouses(): Observable<Warehouse[]> {
    return new Observable(subscriber => {
      this.getWarehouses().then(() => {
        subscriber.next(this.warehousesSubject.value);
      });

      return this.warehousesSubject.subscribe(warehouses => {
        subscriber.next(warehouses);
      });
    });
  }

  async getWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
    const warehouse = await this.getWarehouse(warehouseId);
    if (!warehouse || !warehouse.sectors) return [];

    return warehouse.sectors.reduce((locations: WarehouseLocation[], sector) => {
      const sectorLocations = sector.positions.map(position => ({
        warehouseId,
        sectorId: sector.id,
        position,
        displayName: `${warehouse.name} - ${sector.name} - ${position}`
      }));
      return [...locations, ...sectorLocations];
    }, []);
  }

  private async getWarehouse(id: string): Promise<Warehouse | null> {
    const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
    const snapshot = await getDocs(query(collection(this.firestore, this.COLLECTION_NAME), where('id', '==', id)));
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Warehouse;
  }
} 