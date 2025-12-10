import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const STORAGE_ROOT = path.join(process.cwd(), 'public', 'assets');

function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

export function createUploadMiddleware(folder: string, fieldName: string = 'imagen') {
  const storage = multer.diskStorage({
    destination: function (req: Request, file, cb) {
      const uploadPath = path.join(STORAGE_ROOT, folder);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()
        .substring(0, 30);
      
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = [
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP, GIF, BMP, TIFF, SVG'));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25 MB máximo
    },
    fileFilter: fileFilter,
  }).single(fieldName);
}

export function getPublicUrl(filePath: string): string {
  const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
  return `/${relativePath.replace(/\\/g, '/')}`;
}

export function deleteFile(filePath: string): boolean {
  try {
    let normalizedPath = filePath;
    if (filePath.startsWith('/')) {
      normalizedPath = filePath.substring(1);
    }
    
    const fullPath = path.join(process.cwd(), 'public', normalizedPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    return false;
  }
}

export { STORAGE_ROOT };
