import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const MP3_ROOT = path.join(process.cwd(), 'public', 'assets', 'mp3');

function ensureDirectoryExists(directory: string) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function sanitizeFolderName(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export function crearCarpetaLista(nombreLista: string): string {
  const carpetaSanitizada = sanitizeFolderName(nombreLista);
  const rutaCarpeta = path.join(MP3_ROOT, carpetaSanitizada);
  ensureDirectoryExists(rutaCarpeta);
  return carpetaSanitizada;
}

export function eliminarCarpetaLista(nombreCarpeta: string): boolean {
  try {
    const rutaCarpeta = path.join(MP3_ROOT, nombreCarpeta);
    if (fs.existsSync(rutaCarpeta)) {
      fs.rmSync(rutaCarpeta, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar carpeta:', error);
    return false;
  }
}

export function crearUploadMp3Middleware(carpetaLista: string) {
  const storage = multer.diskStorage({
    destination: function (req: Request, file, cb) {
      const uploadPath = path.join(MP3_ROOT, carpetaLista);
      ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9\u00C0-\u017F]/g, '-')
        .toLowerCase()
        .substring(0, 40);
      
      cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de archivo no permitido. Solo se aceptan: MP3, WAV, OGG'));
    }
  };

  return multer({
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    fileFilter: fileFilter,
  }).array('archivos', 20);
}

export function obtenerUrlPublica(nombreCarpeta: string, nombreArchivo: string): string {
  return `/assets/mp3/${nombreCarpeta}/${nombreArchivo}`;
}

export function eliminarArchivoMp3(nombreCarpeta: string, nombreArchivo: string): boolean {
  try {
    const rutaArchivo = path.join(MP3_ROOT, nombreCarpeta, nombreArchivo);
    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al eliminar archivo MP3:', error);
    return false;
  }
}

export function obtenerArchivosEnCarpeta(nombreCarpeta: string): string[] {
  try {
    const rutaCarpeta = path.join(MP3_ROOT, nombreCarpeta);
    if (fs.existsSync(rutaCarpeta)) {
      return fs.readdirSync(rutaCarpeta).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg', '.webm'].includes(ext);
      });
    }
    return [];
  } catch (error) {
    console.error('Error al leer carpeta:', error);
    return [];
  }
}

export function obtenerTamanoArchivo(nombreCarpeta: string, nombreArchivo: string): number {
  try {
    const rutaArchivo = path.join(MP3_ROOT, nombreCarpeta, nombreArchivo);
    if (fs.existsSync(rutaArchivo)) {
      const stats = fs.statSync(rutaArchivo);
      return stats.size;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

export function existeCarpeta(nombreCarpeta: string): boolean {
  const rutaCarpeta = path.join(MP3_ROOT, nombreCarpeta);
  return fs.existsSync(rutaCarpeta);
}

export function renombrarCarpeta(nombreActual: string, nombreNuevo: string): boolean {
  try {
    const rutaActual = path.join(MP3_ROOT, nombreActual);
    const nuevaCarpeta = sanitizeFolderName(nombreNuevo);
    const rutaNueva = path.join(MP3_ROOT, nuevaCarpeta);
    
    if (fs.existsSync(rutaActual) && !fs.existsSync(rutaNueva)) {
      fs.renameSync(rutaActual, rutaNueva);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al renombrar carpeta:', error);
    return false;
  }
}

ensureDirectoryExists(MP3_ROOT);

export { MP3_ROOT, sanitizeFolderName };
