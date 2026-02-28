// Extends Express's Request so that req.student is fully typed everywhere —
import 'express';
import { IStudent } from '../models/Student';

declare global {
  namespace Express {
    interface Request {
      /**
       * Set by the `protect` middleware after verifying the JWT.
       * Available on every protected route as req.student
       */
      student?: IStudent;
    }
  }
}
