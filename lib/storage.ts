import { access, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
  return UPLOAD_DIR;
}

export async function saveFormFile(file: File) {
  const uploadDir = await ensureUploadDir();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileName = `${Date.now()}_${safeName}`;
  const fullPath = path.join(uploadDir, fileName);
  await writeFile(fullPath, buffer);
  return {
    fileName,
    fullPath,
    relativePath: `/uploads/${fileName}`
  };
}

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export async function saveFromPath(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
    throw new Error(`Desteklenmeyen dosya uzantısı: ${ext}`);
  }

  await access(filePath);

  const uploadDir = await ensureUploadDir();
  const baseName = path.basename(filePath).replace(/[^a-zA-Z0-9._-]/g, "-");
  const fileName = `${Date.now()}_${baseName}`;
  const fullPath = path.join(uploadDir, fileName);
  await copyFile(filePath, fullPath);

  return {
    fileName,
    fullPath,
    relativePath: `/uploads/${fileName}`,
  };
}
