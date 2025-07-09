import { Injectable } from '@angular/core';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { 
  RootMessage, 
  RootMessageType, 
  BusinessRequestMessage,
  MESSAGE_STATUS,
  MESSAGE_PRIORITY,
  MESSAGE_TYPES
} from '../models/root-messages.model';

@Injectable({
  providedIn: 'root'
})
export class RootMessagesService {
  private messagesSubject = new BehaviorSubject<RootMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private firebaseService: FirebaseService) {}

  /**
   * Crear un nuevo mensaje para el usuario Root
   */
  async createMessage(messageData: Omit<RootMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const message = {
        ...messageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(
        collection(this.firebaseService.firestore, 'root-messages'), 
        message
      );

      return docRef.id;
    } catch (error) {
      console.error('Error creating root message:', error);
      throw error;
    }
  }

  /**
   * Crear una solicitud de negocio
   */
  async createBusinessRequest(requestData: Omit<BusinessRequestMessage, 'id' | 'type' | 'status' | 'priority' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const businessRequest: Omit<BusinessRequestMessage, 'id' | 'createdAt' | 'updatedAt'> = {
      ...requestData,
      type: MESSAGE_TYPES.BUSINESS_REQUEST,
      status: MESSAGE_STATUS.PENDING,
      priority: MESSAGE_PRIORITY.MEDIUM
    };

    return this.createMessage(businessRequest);
  }

  /**
   * Obtener todos los mensajes (solo para usuarios Root)
   */
  async getMessages(limitCount: number = 50): Promise<RootMessage[]> {
    try {
      const q = query(
        collection(this.firebaseService.firestore, 'root-messages'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const messages: RootMessage[] = [];

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as RootMessage);
      });

      return messages;
    } catch (error) {
      console.error('Error getting root messages:', error);
      throw error;
    }
  }

  /**
   * Obtener mensajes por tipo
   */
  async getMessagesByType(type: string): Promise<RootMessage[]> {
    try {
      const q = query(
        collection(this.firebaseService.firestore, 'root-messages'),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages: RootMessage[] = [];

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as RootMessage);
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages by type:', error);
      throw error;
    }
  }

  /**
   * Obtener mensajes por estado
   */
  async getMessagesByStatus(status: string): Promise<RootMessage[]> {
    try {
      const q = query(
        collection(this.firebaseService.firestore, 'root-messages'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messages: RootMessage[] = [];

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        } as RootMessage);
      });

      return messages;
    } catch (error) {
      console.error('Error getting messages by status:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de un mensaje
   */
  async updateMessageStatus(messageId: string, status: string, resolvedBy?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      if (status === MESSAGE_STATUS.RESOLVED) {
        updateData.resolvedAt = serverTimestamp();
        if (resolvedBy) {
          updateData.resolvedBy = resolvedBy;
        }
      }

      await updateDoc(
        doc(this.firebaseService.firestore, 'root-messages', messageId),
        updateData
      );
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  /**
   * Agregar notas a un mensaje
   */
  async addMessageNotes(messageId: string, notes: string): Promise<void> {
    try {
      await updateDoc(
        doc(this.firebaseService.firestore, 'root-messages', messageId),
        {
          notes,
          updatedAt: serverTimestamp()
        }
      );
    } catch (error) {
      console.error('Error adding message notes:', error);
      throw error;
    }
  }

  /**
   * Eliminar un mensaje
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firebaseService.firestore, 'root-messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en tiempo real (solo para usuarios Root)
   */
  listenToMessages(): Observable<RootMessage[]> {
    const q = query(
      collection(this.firebaseService.firestore, 'root-messages'),
      orderBy('createdAt', 'desc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: RootMessage[] = [];
        querySnapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data()
          } as RootMessage);
        });
        observer.next(messages);
      }, (error) => {
        console.error('Error listening to messages:', error);
        observer.error(error);
      });

      return unsubscribe;
    });
  }

  /**
   * Obtener estadísticas de mensajes
   */
  async getMessageStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    byType: { [key: string]: number };
  }> {
    try {
      const messages = await this.getMessages(1000); // Obtener todos para estadísticas
      
      const stats = {
        total: messages.length,
        pending: messages.filter(m => m.status === MESSAGE_STATUS.PENDING).length,
        inProgress: messages.filter(m => m.status === MESSAGE_STATUS.IN_PROGRESS).length,
        resolved: messages.filter(m => m.status === MESSAGE_STATUS.RESOLVED).length,
        rejected: messages.filter(m => m.status === MESSAGE_STATUS.REJECTED).length,
        byType: {} as { [key: string]: number }
      };

      // Contar por tipo
      messages.forEach(message => {
        stats.byType[message.type] = (stats.byType[message.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting message stats:', error);
      throw error;
    }
  }
} 