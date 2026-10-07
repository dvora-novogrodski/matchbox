import {
    createUserWithEmailAndPassword,
    deleteUser,
    GoogleAuthProvider,
    sendEmailVerification,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
} from '@firebase/auth';

import { firebaseAuth } from '../../../lib/firebase/firebase';

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function signInWithGoogle(): Promise<void> {
    await signInWithPopup(firebaseAuth, googleProvider);
}

export async function signUpWithEmail(displayName: string, email: string, password: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    try {
        await updateProfile(credential.user, { displayName });
        await sendEmailVerification(credential.user);
    } catch (error) {
        try {
            await deleteUser(credential.user);
        } catch {
            await signOut(firebaseAuth).catch(() => undefined);
        }
        throw error;
    }
    await signOut(firebaseAuth);
}

export async function requestPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(firebaseAuth, email);
}

export async function signOutUser(): Promise<void> {
    await signOut(firebaseAuth);
}
