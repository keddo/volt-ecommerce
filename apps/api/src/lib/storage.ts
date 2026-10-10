import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StoredFile {
  url: string;
  path: string;
}

export interface StorageAdapter {
  save(file: UploadedFile): Promise<StoredFile>;
  delete(storedPath: string): Promise<void>;
}

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-80);
}

class LocalDiskStorage implements StorageAdapter {
  async save(file: UploadedFile): Promise<StoredFile> {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const fileName = `${crypto.randomUUID()}-${sanitizeFileName(file.originalName)}`;
    await fs.writeFile(path.join(UPLOADS_DIR, fileName), file.buffer);
    return { url: `/uploads/${fileName}`, path: fileName };
  }

  async delete(storedPath: string): Promise<void> {
    await fs.rm(path.join(UPLOADS_DIR, storedPath), { force: true });
  }
}

// Swap this single export for a CloudinaryStorage/S3Storage implementation later;
// every caller depends only on the StorageAdapter interface above.
export const storage: StorageAdapter = new LocalDiskStorage();
export { UPLOADS_DIR };
