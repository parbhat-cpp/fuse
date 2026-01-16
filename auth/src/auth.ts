import type {Request, Response} from 'express';
import {verify} from 'jsonwebtoken';

export const authenticateUser = async(req: Request, res: Response) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({message: 'Authorization header missing'});
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({message: 'Token missing'});
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            return res.status(500).json({message: 'JWT secret not configured'});
        }

        const payload = verify(token, jwtSecret);

        res.setHeader('X-User-Id', (payload as any).sub);
        res.setHeader('X-User-Email', (payload as any).email);
        res.setHeader('X-User-Name', (payload as any).user_metadata?.full_name || '');

        return res.status(200).json({message: 'User authenticated'});
    } catch (error) {
        return res.status(401).json({message: 'Invalid token'});
    }
}
