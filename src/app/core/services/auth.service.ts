import { Injectable, inject, NgZone } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile, 
  createUserWithEmailAndPassword,
  sendEmailVerification
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { UserSession } from '../models/user-session.model';
import { SessionStorageService } from './session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private ngZone: NgZone = inject(NgZone);
  private sessionStorage: SessionStorageService = inject(SessionStorageService);
  
  private readonly STORAGE_KEYS = {
    USER_SESSION: 'user_session',
    LAST_ACTIVITY: 'last_activity'
  };
  
  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Intentar restaurar la sesión del sessionStorage
    const savedSession = this.sessionStorage.get<UserSession>(this.STORAGE_KEYS.USER_SESSION);
    if (savedSession) {
      this.currentUserSubject.next(savedSession);
    }

    // Observar cambios en el estado de autenticación
    this.auth.onAuthStateChanged(async (user) => {
      this.ngZone.run(async () => {
        if (user) {
          const userProfile = await this.getUserProfile(user.uid);
          if (userProfile) {
            this.sessionStorage.set(this.STORAGE_KEYS.USER_SESSION, userProfile);
            this.currentUserSubject.next(userProfile);
          }
        } else {
          this.sessionStorage.remove(this.STORAGE_KEYS.USER_SESSION);
          this.currentUserSubject.next(null);
        }
      });
    });
  }

  async login(email: string, password: string): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        const userProfile = await this.getUserProfile(userCredential.user.uid);
        
        if (!userProfile?.isActive) {
          await this.logout();
          throw new Error('Usuario inactivo');
        }
        
        this.sessionStorage.set(this.STORAGE_KEYS.USER_SESSION, userProfile);
        this.sessionStorage.updateTimestamp(this.STORAGE_KEYS.LAST_ACTIVITY);
        this.currentUserSubject.next(userProfile);
      } catch (error: any) {
        console.error('Error en login:', error);
        throw error;
      }
    });
  }

  async logout(): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        await signOut(this.auth);
        this.sessionStorage.remove(this.STORAGE_KEYS.USER_SESSION);
        this.sessionStorage.remove(this.STORAGE_KEYS.LAST_ACTIVITY);
        this.currentUserSubject.next(null);
      } catch (error) {
        console.error('Error en logout:', error);
        throw error;
      }
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        await sendPasswordResetEmail(this.auth, email);
      } catch (error) {
        console.error('Error al enviar email de recuperación:', error);
        throw error;
      }
    });
  }

  private async getUserProfile(uid: string): Promise<UserSession | null> {
    return this.ngZone.run(async () => {
      try {
        const userDoc = await getDoc(doc(this.firestore, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            uid: userDoc.id,
            email: data['email'],
            displayName: data['displayName'],
            roleId: data['roleId'],
            businessId: data['businessId'],
            isActive: data['isActive'],
            lastLogin: Date.now(),
            accessToken: await this.auth.currentUser?.getIdToken(),
            createdAt: data['createdAt']?.toDate()
          };
        }
        return null;
      } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        return null;
      }
    });
  }

  getCurrentUserProfile(): UserSession | null {
    return this.currentUserSubject.value;
  }

  isRoot(): boolean {
    const currentUser = this.getCurrentUserProfile();
    return currentUser?.roleId === 'root';
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  async updateUserProfile(data: { displayName?: string; password?: string; isFirstLogin?: boolean }): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        const user = this.auth.currentUser;
        if (!user) throw new Error('No hay usuario autenticado');

        if (data.displayName) {
          await updateProfile(user, { displayName: data.displayName });
        }

        // Actualizar documento en Firestore
        const userRef = doc(this.firestore, 'users', user.uid);
        await updateDoc(userRef, {
          displayName: data.displayName,
          isFirstLogin: data.isFirstLogin
        });

        // Actualizar el estado local
        const updatedProfile = await this.getUserProfile(user.uid);
        if (updatedProfile) {
          this.currentUserSubject.next(updatedProfile);
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
      }
    });
  }

  async createUserWithMagicLink(email: string, userData: Partial<UserSession>): Promise<void> {
    return this.ngZone.run(async () => {
      try {
        // Guardar el email del admin actual
        const adminEmail = this.getCurrentUserProfile()?.email;
        
        // Generar una contraseña temporal
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
        
        // 1. Crear el usuario con email y contraseña temporal
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, tempPassword);
        const user = userCredential.user;

        // 2. Enviar email de verificación
        await sendEmailVerification(user);
        
        // 3. Crear el documento en Firestore
        const userRef = doc(this.firestore, 'users', user.uid);
        await setDoc(userRef, {
          ...userData,
          email,
          uid: user.uid,
          isFirstLogin: true,
          isActive: true,
          createdAt: serverTimestamp()
        });

        // 4. Enviar email de restablecimiento de contraseña
        await sendPasswordResetEmail(this.auth, email);

        // 5. Cerrar sesión del usuario recién creado
        await signOut(this.auth);

        // 6. Si teníamos un admin logueado, restaurar su sesión
        if (adminEmail) {
          await this.login(adminEmail, 'geraDevs9003..Root');
        }
      } catch (error) {
        console.error('Error creating user:', error);
        throw error;
      }
    });
  }
} 