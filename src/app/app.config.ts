import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "boom-stats", appId: "1:911762519847:web:1cf7d3f34cb1b9d278db02", storageBucket: "boom-stats.firebasestorage.app", apiKey: "AIzaSyAt4GzpT4ga1oOzN5kSjqb5yIXMRFO-H5s", authDomain: "boom-stats.firebaseapp.com", messagingSenderId: "911762519847", measurementId: "G-N1L3CC0D01" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase())]
};
