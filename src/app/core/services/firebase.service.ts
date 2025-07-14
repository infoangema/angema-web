import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import { firebaseConfig } from '../../config/firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(firebaseConfig);
  public auth = getAuth(this.app);
  public firestore = getFirestore(this.app);
  public storage = getStorage(this.app);
  public realtimeDatabase = getDatabase(this.app);

  constructor() {
    console.log('Firebase initialized successfully');
    console.log('Realtime Database URL:', firebaseConfig.databaseURL);
  }
} 