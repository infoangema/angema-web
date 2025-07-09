import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  UserCredential,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { emailLinkSettings } from '../../config/firebase.config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  businessId?: string;
  roleId: string;
  isActive: boolean;
  createdAt: any;
  lastLogin?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.initAuthListener();
    this.handleEmailLinkSignIn();
  }

  private initAuthListener() {
    onAuthStateChanged(this.firebaseService.auth, async (user) => {
      this.currentUserSubject.next(user);
      
      if (user) {
        const profile = await this.getUserProfile(user.uid);
        this.userProfileSubject.next(profile);
      } else {
        this.userProfileSubject.next(null);
      }
    });
  }

  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.firebaseService.auth, 
        email, 
        password
      );
      
      // Actualizar último login
      await this.updateLastLogin(userCredential.user.uid);
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseService.auth);
      this.router.navigate(['/']);
    } catch (error) {
      throw error;
    }
  }

  async createUser(email: string, password: string, userData: Partial<UserProfile>): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        email,
        password
      );

      // Crear perfil de usuario en Firestore
      await this.createUserProfile(userCredential.user.uid, {
        ...userData,
        uid: userCredential.user.uid,
        email: email,
        isActive: true,
        createdAt: serverTimestamp()
      });

      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  private async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.firebaseService.firestore, 'users', uid));
      return userDoc.exists() ? userDoc.data() as UserProfile : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      await setDoc(doc(this.firebaseService.firestore, 'users', uid), userData);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  private async updateLastLogin(uid: string): Promise<void> {
    try {
      await setDoc(
        doc(this.firebaseService.firestore, 'users', uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.userProfileSubject.value;
  }

  hasRole(roleId: string): boolean {
    const profile = this.getCurrentUserProfile();
    return profile?.roleId === roleId;
  }

  isRoot(): boolean {
    return this.hasRole('root');
  }

  isSuperAdmin(): boolean {
    return this.hasRole('root'); // Backward compatibility
  }

  // Email Link Authentication Methods
  async sendSignInLinkToEmail(email: string): Promise<void> {
    const actionCodeSettings = {
      ...emailLinkSettings,
      url: `${emailLinkSettings.url}?email=${email}`
    };

    try {
      await sendSignInLinkToEmail(this.firebaseService.auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      this.notificationService.success('Enlace de acceso enviado al email');
    } catch (error) {
      console.error('Error sending email link:', error);
      throw error;
    }
  }

  async signInWithEmailLink(email: string, emailLink: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailLink(this.firebaseService.auth, email, emailLink);
      window.localStorage.removeItem('emailForSignIn');
      
      // Actualizar último login
      await this.updateLastLogin(userCredential.user.uid);
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with email link:', error);
      throw error;
    }
  }

  private handleEmailLinkSignIn(): void {
    if (isSignInWithEmailLink(this.firebaseService.auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      
      if (email) {
        this.signInWithEmailLink(email, window.location.href)
          .then(() => {
            this.notificationService.success('¡Acceso exitoso!');
            this.router.navigate(['/app/dashboard']);
          })
          .catch((error) => {
            this.notificationService.error('Error en el acceso: ' + error.message);
          });
      }
    }
  }

  async sendEmailVerification(): Promise<void> {
    const user = this.getCurrentUser();
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
        this.notificationService.success('Email de verificación enviado');
      } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
      }
    }
  }
} 