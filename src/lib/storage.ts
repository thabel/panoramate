import { writeFile, unlink, access, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10);

export async function saveUploadedFile(
  buffer: Buffer,
  organizationId: string,
  tourId: string,
  originalName: string
): Promise<{ filename: string; width: number; height: number; sizeMb: number }> {
  // Validate file size
  const sizeMb = buffer.length / (1024 * 1024);
  if (sizeMb > MAX_FILE_SIZE_MB) {
    throw new Error(`File size (${sizeMb.toFixed(2)}MB) exceeds maximum (${MAX_FILE_SIZE_MB}MB)`);
  }

  // Get image dimensions
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Generate unique filename
  const ext = originalName.split('.').pop() || 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const filepath = join(UPLOAD_DIR, organizationId, tourId, filename);

  // Ensure directory exists
  const dirPath = dirname(filepath);
  await mkdir(dirPath, { recursive: true });

  // Save file
  await writeFile(filepath, buffer);

  return {
    filename: `${organizationId}/${tourId}/${filename}`,
    width,
    height,
    sizeMb,
  };
}

export async function saveGeneralFile(
  buffer: Buffer,
  organizationId: string,
  tourId: string,
  originalName: string
): Promise<{ filename: string; sizeMb: number }> {
  // Validate file size
  const sizeMb = buffer.length / (1024 * 1024);
  const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10);
  if (sizeMb > MAX_FILE_SIZE_MB) {
    throw new Error(`File size (${sizeMb.toFixed(2)}MB) exceeds maximum (${MAX_FILE_SIZE_MB}MB)`);
  }

  // Generate unique filename
  const ext = originalName.split('.').pop() || 'mp3';
  const filename = `${uuidv4()}.${ext}`;
  const filepath = join(UPLOAD_DIR, organizationId, tourId, filename);

  // Ensure directory exists
  const dirPath = dirname(filepath);
  await mkdir(dirPath, { recursive: true });

  // Save file
  await writeFile(filepath, buffer);

  return {
    filename: `${organizationId}/${tourId}/${filename}`,
    sizeMb,
  };
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = join(UPLOAD_DIR, filename);
  try {
    await unlink(filepath);
  } catch (err) {
    // File may not exist, ignore error
  }
}

export function getFileUrl(filename: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/uploads/${filename}`;
}

export async function getImageDimensions(filepath: string): Promise<{ width: number; height: number }> {
  const metadata = await sharp(filepath).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
  };
}
