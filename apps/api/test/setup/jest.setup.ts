// Firebase Admin's auth package currently loads ESM-only jose through CommonJS.
// Jest 29 cannot evaluate that dependency, so e2e tests replace the adapter at the module boundary.
jest.mock('../../src/integrations/firebase/firebase-auth-verifier', () => ({
  FirebaseAuthVerifier: class FirebaseAuthVerifier {},
}));
