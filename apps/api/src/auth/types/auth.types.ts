export type AuthIdentity = {
  firebaseUid: string;
  email: string;
  displayName: string | null;
};

export type AuthUser = AuthIdentity & {
  id: string;
};

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  authUser?: AuthUser;
};
