import { Readable } from 'stream';
import { parse } from 'fast-csv';
import { CreateUserDto } from '../dto/create-user.dto';

export function parseUsersCsv(buffer: Buffer): Promise<CreateUserDto[]> {
  return new Promise((resolve, reject) => {
    const rows: CreateUserDto[] = [];
    const stream = Readable.from(buffer.toString());
    stream
      .pipe(parse({ headers: true }))
      .on('data', (row: Record<string, string>) => {
        const name = row['Name']?.trim();
        const email = row['Email']?.trim()?.toLocaleLowerCase();
        if (name && email) {
          rows.push({
            name,
            email,
            phone_number: row['Phone']?.trim() || null,
            gender: row['Gender']?.trim() || null,
            city: row['Town']?.trim() || null,
            country: row['Country']?.trim() || null
          });
        }
      })
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}
