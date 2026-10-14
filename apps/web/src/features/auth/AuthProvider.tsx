import { onIdTokenChanged, type User } from '@firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { firebaseAuth } from 'src/lib/firebase/firebase';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    () =>
      onIdTokenChanged(firebaseAuth, (nextUser) => {
        setUser(nextUser);
        setIsLoading(false);
      }),
    [],
  );

  const value = useMemo(() => ({ user, isLoading }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}

export function useFirebaseUser(): User | null {
  const context = useContext(AuthContext);
  return context?.user ?? null;
}
