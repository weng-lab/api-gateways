import { Request, Response, NextFunction } from "express";
export interface User {
    uid: string;
    email: string;
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
