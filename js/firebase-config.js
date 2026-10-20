/*
 * FIREBASE CONNECTION — fill this in before deploying.
 *
 * This is the only place the hospital's Firebase project is named. Every
 * screen, the patient portal and the waiting-room display all read from
 * here, so there is one value to set and nothing to miss.
 *
 * Where to find these values:
 *   Firebase Console -> Project settings -> General
 *   -> Your apps -> Web app -> SDK setup and configuration -> Config
 *
 * Copy the six values across exactly as shown there.
 *
 * These keys are safe to publish. A Firebase web config is public by
 * design; access is controlled by Firestore Security Rules, not by
 * keeping this file secret.
 *
 * Leave this file untouched for local development: on localhost the app
 * ignores it and uses the Firebase emulators instead.
 */
window.FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAmWNzDp8FDScqUFhpSlpn94HaHFXxq_Ao',
    authDomain: 'jyothsna-maternity-hms.firebaseapp.com',
    projectId: 'jyothsna-maternity-hms',
    storageBucket: 'jyothsna-maternity-hms.firebasestorage.app',
    messagingSenderId: '146009049073',
    appId: '1:146009049073:web:8e9499070d760229c02650'
};

/* Cloud Functions region. Change only if you deploy functions elsewhere. */
window.FIREBASE_REGION = 'asia-south1';
