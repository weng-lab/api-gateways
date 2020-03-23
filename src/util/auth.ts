import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

export interface User {
    uid: string;
    email: string;
}

/**
 * Express middleware that verifies and decodes JWT, and puts it into locals.user 
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Assumes the format: "Authorization: Bearer <token>"
    const authorization = req.header('Authorization');
    if (authorization) {
        try {
            const token = authorization.split(' ')[1];
            const decodedToken = await admin.auth().verifyIdToken(token);
            res.locals.user = decodedToken;
        } catch (error) {
            res.status(401).send();
            return;
        }
    }
    next();
}