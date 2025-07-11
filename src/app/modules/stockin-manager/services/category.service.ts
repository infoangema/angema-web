import { Injectable } from '@angular/core';
import { Firestore, collection, doc, query, where, orderBy, getDocs, addDoc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Category, CategoryHierarchy } from '../models/category.model';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { RootBusinessSelectorService } from './root-business-selector.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly COLLECTION_NAME = 'categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  categories$ = this.categoriesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private businessService: BusinessService,
    private authService: AuthService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  // CRUD básico
  async createCategory(category: Omit<Category, 'id'>): Promise<string> {
    const businessId = await this.businessService.getCurrentBusinessId();
    if (!businessId && !this.authService.isRoot()) {
      throw new Error('No business ID available for category creation');
    }
    const categoryWithBusiness = { ...category, businessId: businessId || '' };
    const docRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), categoryWithBusiness);
    return docRef.id;
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
    await updateDoc(docRef, { ...category, updatedAt: new Date() });
  }

  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION_NAME, id);
    await updateDoc(docRef, { isActive: false, updatedAt: new Date() });
  }

  // Consultas
  async getCategories(): Promise<Category[]> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      // Para usuarios root, usar la selección de negocio
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
      console.log('=== ROOT USER CATEGORIES QUERY ===');
      console.log('Root business selection:', this.rootBusinessSelector.getCurrentSelection());
      console.log('Effective business ID:', businessId);
    } else {
      // Para usuarios regulares, usar su businessId asignado
      businessId = await this.businessService.getCurrentBusinessId();
      console.log('=== REGULAR USER CATEGORIES QUERY ===');
      console.log('User business ID:', businessId);
    }
    
    let q;
    if (!isRoot && businessId) {
      // Regular users: filter by their business
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('businessId', '==', businessId),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else if (isRoot && businessId) {
      // Root users with specific business selected
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('businessId', '==', businessId),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else if (isRoot && !businessId) {
      // Root users showing all businesses
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else {
      // No business ID and not root - return empty array
      this.categoriesSubject.next([]);
      return [];
    }

    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
    this.categoriesSubject.next(categories);
    return categories;
  }

  watchCategories(): Observable<Category[]> {
    return new Observable(subscriber => {
      this.getCategories().then(() => {
        subscriber.next(this.categoriesSubject.value);
      });

      return this.categoriesSubject.subscribe(categories => {
        subscriber.next(categories);
      });
    });
  }

  async getCategoryHierarchy(): Promise<CategoryHierarchy[]> {
    const categories = await this.getCategories();
    return this.buildHierarchy(categories);
  }

  private buildHierarchy(categories: Category[], parentId: string | null = null): CategoryHierarchy[] {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        children: this.buildHierarchy(categories, category.id)
      }));
  }
} 