import { Injectable } from '@angular/core';
import { Firestore, collection, doc, query, where, orderBy, getDocs, addDoc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { Category, CategoryHierarchy } from '../models/category.model';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';

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
    private authService: AuthService
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
    const businessId = await this.businessService.getCurrentBusinessId();
    
    let q;
    if (isRoot) {
      // Root users see all categories from all businesses
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else if (businessId) {
      // Regular users see only their business categories
      q = query(
        collection(this.firestore, this.COLLECTION_NAME),
        where('businessId', '==', businessId),
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