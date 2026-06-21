import type { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';

async function findAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoryService.findAll();
    res.json({ categories });
  } catch (error) {
    next(error);
  }
}

async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params.id), 10);
    const category = await categoryService.findById(id);
    res.json({ category });
  } catch (error) {
    next(error);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoryService.create(req.body);
    res.status(201).json({ category });
  } catch (error) {
    next(error);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params.id), 10);
    const category = await categoryService.update(id, req.body);
    res.json({ category });
  } catch (error) {
    next(error);
  }
}

async function softDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(String(req.params.id), 10);
    const result = await categoryService.softDelete(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export const categoryController = { findAll, findById, create, update, softDelete };
