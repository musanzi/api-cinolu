import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

export function createDiskUploadOptions(destination: string): MulterOptions {
  return {
    storage: diskStorage({
      destination,
      filename: (_req, file, cb) => {
        cb(null, `${uuidv4()}.${file.mimetype?.split('/')[1]?.split(';')[0]}`);
      }
    })
  };
}
