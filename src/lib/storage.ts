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

/**
 * Save cube map tiles for a scene
 * Expects files organized as: {z}/{f}/{y}/{x}.jpg
 * where z = zoom level, f = face (front, back, left, right, top, bottom)
 */
export async function saveCubeMapTiles(
  files: Array<{ buffer: Buffer; path: string }>, // path like "0/front/0/0.jpg"
  organizationId: string,
  tourId: string,
  sceneId: string
): Promise<{ basePath: string; sceneId: string; availableLevels: Array<{ tileSize: number; size: number }> }> {
  const basePath = `${organizationId}/${tourId}`;
  const scenePath = join(UPLOAD_DIR, basePath, sceneId);

  // Ensure scene directory exists
  await mkdir(scenePath, { recursive: true });

  // Collect available levels from saved tiles
  const levelsSet = new Set<string>();

  // Save all tiles
  for (const file of files) {
    const tilePath = join(scenePath, file.path);
    const tileDir = dirname(tilePath);

    // Ensure tile directory exists
    await mkdir(tileDir, { recursive: true });

    // Validate file size
    const sizeMb = file.buffer.length / (1024 * 1024);
    if (sizeMb > MAX_FILE_SIZE_MB) {
      throw new Error(`Tile size (${sizeMb.toFixed(2)}MB) exceeds maximum (${MAX_FILE_SIZE_MB}MB)`);
    }

    // Save tile
    await writeFile(tilePath, file.buffer);

    // Extract zoom level from path (first segment)
    const pathParts = file.path.split('/');
    if (pathParts[0]) {
      levelsSet.add(pathParts[0]);
    }
  }

  // Return with default levels for now (can be extended based on actual tiles)
  const availableLevels = [
    { tileSize: 256, size: 256 },
    { tileSize: 512, size: 512 },
    { tileSize: 512, size: 1024 },
    { tileSize: 512, size: 2048 },
  ];

  return {
    basePath: `/api/uploads/${basePath}`,
    sceneId,
    availableLevels,
  };
}

/**
 * Save cube map preview image
 * Used as fallback image when loading cube maps
 */
export async function saveCubeMapPreview(
  buffer: Buffer,
  organizationId: string,
  tourId: string,
  sceneId: string
): Promise<{ previewUrl: string; width: number; height: number; sizeMb: number }> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const sizeMb = buffer.length / (1024 * 1024);

  if (sizeMb > MAX_FILE_SIZE_MB) {
    throw new Error(`Preview size (${sizeMb.toFixed(2)}MB) exceeds maximum (${MAX_FILE_SIZE_MB}MB)`);
  }

  const basePath = `${organizationId}/${tourId}`;
  const previewFilename = 'preview.jpg';
  const previewPath = join(UPLOAD_DIR, basePath, sceneId, previewFilename);

  // Ensure directory exists
  const dirPath = dirname(previewPath);
  await mkdir(dirPath, { recursive: true });

  // Save preview
  await writeFile(previewPath, buffer);

  return {
    previewUrl: `/api/uploads/${basePath}/${sceneId}/${previewFilename}`,
    width,
    height,
    sizeMb,
  };
}

/**
 * Delete entire cube map scene directory
 */
export async function deleteCubeMapScene(organizationId: string, tourId: string, sceneId: string): Promise<void> {
  const scenePath = join(UPLOAD_DIR, organizationId, tourId, sceneId);
  try {
    // Recursively delete the scene directory
    const fs = require('fs');
    if (fs.existsSync(scenePath)) {
      fs.rmSync(scenePath, { recursive: true, force: true });
    }
  } catch (err) {
    // Directory may not exist, ignore error
  }
}
