import { getApp, getApps, initializeApp } from '@firebase/app';
import { type Auth, connectAuthEmulator, getAuth } from '@firebase/auth';

import { env } from '../env';

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(env.firebase);

export const firebaseAuth: Auth = getAuth(firebaseApp);

if (env.firebaseAuthEmulatorHost && !firebaseAuth.emulatorConfig) {
    connectAuthEmulator(firebaseAuth, `http://${env.firebaseAuthEmulatorHost}`, { disableWarnings: true });
}
