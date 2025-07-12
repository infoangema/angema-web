import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot
} from '@angular/fire/firestore';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Crear un documento en una colección
   */
  async create<T extends DocumentData>(collectionName: string, data: T): Promise<string> {
    try {
      const collectionRef = collection(this.firebaseService.firestore, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener un documento por ID
   */
  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id, // Firestore document ID always wins
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate(),
          lastLogin: data['lastLogin']?.toDate()
        } as T;
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar un documento
   */
  async update<T extends Partial<DocumentData>>(
    collectionName: string, 
    id: string, 
    data: T
  ): Promise<void> {
    try {
      // Debug: Check if ID is valid
      console.log('DatabaseService.update called with:');
      console.log('- Collection:', collectionName);
      console.log('- ID:', `"${id}"`);
      console.log('- ID type:', typeof id);
      console.log('- ID length:', id?.length);
      console.log('- Data:', data);

      if (!id || id.trim() === '') {
        throw new Error(`Invalid document ID: "${id}". Document ID cannot be empty.`);
      }

      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error updating document ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar un documento (soft delete)
   */
  async softDelete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      await updateDoc(docRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error soft deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar un documento permanentemente
   */
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document ${id} from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todos los documentos de una colección
   */
  getAll<T>(collectionName: string, orderByField: string = 'createdAt', orderDirection: 'asc' | 'desc' = 'desc'): Observable<T[]> {
    const collectionRef = collection(this.firebaseService.firestore, collectionName);
    const q = query(collectionRef, orderBy(orderByField, orderDirection));
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const documents: T[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id, // Firestore document ID always wins
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
            lastLogin: data['lastLogin']?.toDate()
          } as T;
        });
        observer.next(documents);
      }, (error) => {
        console.error(`Error getting all documents from ${collectionName}:`, error);
        observer.error(error);
      });
      
      return unsubscribe;
    });
  }

  /**
   * Obtener documentos con filtro WHERE
   */
  getWhere<T>(
    collectionName: string, 
    field: string, 
    operator: any, 
    value: any,
    orderByField: string = 'createdAt',
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Observable<T[]> {
    const collectionRef = collection(this.firebaseService.firestore, collectionName);
    const q = query(
      collectionRef, 
      where(field, operator, value),
      orderBy(orderByField, orderDirection)
    );
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const documents: T[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id, // Firestore document ID always wins
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
            lastLogin: data['lastLogin']?.toDate()
          } as T;
        });
        observer.next(documents);
      }, (error) => {
        console.error(`Error getting filtered documents from ${collectionName}:`, error);
        observer.error(error);
      });
      
      return unsubscribe;
    });
  }

  /**
   * Obtener documentos con query personalizada
   */
  getWithQuery<T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Observable<T[]> {
    const collectionRef = collection(this.firebaseService.firestore, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const documents: T[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id, // Firestore document ID always wins
            createdAt: data['createdAt']?.toDate(),
            updatedAt: data['updatedAt']?.toDate(),
            lastLogin: data['lastLogin']?.toDate()
          } as T;
        });
        observer.next(documents);
      }, (error) => {
        console.error(`Error getting documents with custom query from ${collectionName}:`, error);
        observer.error(error);
      });
      
      return unsubscribe;
    });
  }

  /**
   * Obtener documentos una sola vez (sin listener)
   */
  async getOnce<T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> {
    try {
      const collectionRef = collection(this.firebaseService.firestore, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents: T[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          ...data,
          id: doc.id, // Firestore document ID always wins
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate(),
          lastLogin: data['lastLogin']?.toDate()
        } as T);
      });
      
      // Remove duplicates to prevent tracking errors
      const seen = new Set<string>();
      const uniqueDocuments = documents.filter(doc => {
        const docId = (doc as any).id;
        if (seen.has(docId)) {
          return false;
        }
        seen.add(docId);
        return true;
      });
      
      return uniqueDocuments;
    } catch (error) {
      console.error(`Error getting documents once from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Contar documentos en una colección
   */
  async count(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<number> {
    try {
      const collectionRef = collection(this.firebaseService.firestore, collectionName);
      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error(`Error counting documents in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Verificar si un documento existe
   */
  async exists(collectionName: string, id: string): Promise<boolean> {
    try {
      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking if document ${id} exists in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Crear documento con ID personalizado
   */
  async createWithId<T extends DocumentData>(
    collectionName: string, 
    id: string, 
    data: T
  ): Promise<void> {
    try {
      const docRef = doc(this.firebaseService.firestore, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error creating document with ID ${id} in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Ejecutar una consulta compleja con paginación
   */
  async query<T extends DocumentData>(
    collectionName: string, 
    constraints: {
      where?: { field: string; operator: any; value: any }[];
      orderBy?: { field: string; direction?: 'asc' | 'desc' }[];
      pageSize?: number;
      startAfter?: DocumentSnapshot<T>;
    }
  ): Promise<{
    items: T[];
    lastDoc: QueryDocumentSnapshot<T> | null;
    hasMore: boolean;
  }> {
    try {
      const collectionRef = collection(this.firebaseService.firestore, collectionName) as CollectionReference<T>;
      const queryConstraints: QueryConstraint[] = [];

      // Agregar condiciones WHERE
      if (constraints.where) {
        constraints.where.forEach(condition => {
          queryConstraints.push(where(condition.field, condition.operator, condition.value));
        });
      }

      // Agregar ordenamiento
      if (constraints.orderBy) {
        constraints.orderBy.forEach(sort => {
          queryConstraints.push(orderBy(sort.field, sort.direction || 'asc'));
        });
      }

      // Agregar paginación
      if (constraints.startAfter) {
        queryConstraints.push(startAfter(constraints.startAfter));
      }
      if (constraints.pageSize) {
        queryConstraints.push(limit(constraints.pageSize + 1)); // +1 para saber si hay más páginas
      }

      const q = query(collectionRef, ...queryConstraints);
      const snapshot = await getDocs(q) as QuerySnapshot<T>;

      let items = snapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure the Firestore document ID takes precedence over any id in data
        return {
          ...data,
          id: doc.id, // Firestore document ID always wins
          createdAt: data['createdAt']?.toDate(),
          updatedAt: data['updatedAt']?.toDate()
        } as T;
      });

      // Remove duplicates based on document ID to prevent tracking errors
      const seen = new Set<string>();
      items = items.filter(item => {
        const itemId = (item as any).id;
        if (seen.has(itemId)) {
          return false;
        }
        seen.add(itemId);
        return true;
      });

      let hasMore = false;
      if (constraints.pageSize && items.length > constraints.pageSize) {
        hasMore = true;
        items = items.slice(0, constraints.pageSize);
      }

      return {
        items,
        lastDoc: items.length > 0 ? snapshot.docs[items.length - 1] : null,
        hasMore
      };
    } catch (error) {
      console.error(`Error executing query on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener referencia de colección
   */
  getCollectionRef(collectionName: string): CollectionReference {
    return collection(this.firebaseService.firestore, collectionName);
  }

  /**
   * Obtener referencia de documento
   */
  getDocRef(collectionName: string, id: string): DocumentReference {
    return doc(this.firebaseService.firestore, collectionName, id);
  }
} 