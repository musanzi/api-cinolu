import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export function createCsvUploadOptions(): MulterOptions {
  return {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      const allowed = ['text/csv', 'application/csv', 'text/plain'];
      const isCsv = allowed.includes(file.mimetype) || file.originalname?.toLowerCase().endsWith('.csv');
      cb(null, !!isCsv);
    },
    limits: { fileSize: 2 * 1024 * 1024 }
  };
}
