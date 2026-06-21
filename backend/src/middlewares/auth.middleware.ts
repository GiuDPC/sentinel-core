import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Middleware de autenticación.
 * Soporta dos métodos (para compatibilidad web + desktop/Tauri):
 * 1. Cookie httpOnly `token` (prioridad)
 * 2. Header `Authorization: Bearer <token>` (fallback)
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    let token = req.cookies?.token;

    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        }
    }

    if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as {
            id: string;
            email: string;
            role: string;
        };
        req.user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Token invalido o expirado' });
    }
}