export interface AuthContext {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
    }
  }
}
