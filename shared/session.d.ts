// Declaration file to extend express-session
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}