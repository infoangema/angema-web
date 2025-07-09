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
  DocumentReference
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
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data()['createdAt']?.toDate(),
          updatedAt: docSnap.data()['updatedAt']?.toDate(),
          lastLogin: docSnap.data()['lastLogin']?.toDate()
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
        const documents: T[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate(),
          updatedAt: doc.data()['updatedAt']?.toDate(),
          lastLogin: doc.data()['lastLogin']?.toDate()
        } as T));
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
        const documents: T[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate(),
          updatedAt: doc.data()['updatedAt']?.toDate(),
          lastLogin: doc.data()['lastLogin']?.toDate()
        } as T));
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
        const documents: T[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate(),
          updatedAt: doc.data()['updatedAt']?.toDate(),
          lastLogin: doc.data()['lastLogin']?.toDate()
        } as T));
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
        documents.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data()['createdAt']?.toDate(),
          updatedAt: doc.data()['updatedAt']?.toDate(),
          lastLogin: doc.data()['lastLogin']?.toDate()
        } as T);
      });
      
      return documents;
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