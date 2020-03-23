import { Request, Response, NextFunction } from "express";
import { Express } from "express";

/**
 * Express middleware that just places base64 encoded values from the header 'MockUser'
 */
export async function mockAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const mockUserHeader = req.header('MockUser');
    if (mockUserHeader) {
        try {
            res.locals.user = JSON.parse(Buffer.from(mockUserHeader, 'base64').toString('ascii'));
        } catch (error) {
            res.status(401).send();
            return;
        }
    }
    next();
}

export const addMockAuthMiddleware = (app: Express) => app.use(mockAuthMiddleware);

export const MOCK_USER_1 = { uid: 1, email: "test@example.com" };
export const MOCK_USER_1_B64 = Buffer.from(JSON.stringify(MOCK_USER_1)).toString('base64');