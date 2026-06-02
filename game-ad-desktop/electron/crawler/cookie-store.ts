import * as fs from 'fs';
import * as path from 'path';
import { app, safeStorage } from 'electron';
import { sanitizeId } from '../utils';

export class CookieStore {
  private storePath: string;

  constructor() {
    const userData = app.getPath('userData');
    this.storePath = path.join(userData, 'cookies');
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  async saveCookies(platform: string, cookies: any[]): Promise<void> {
    try {
      const safeId = sanitizeId(platform);
      const filePath = path.join(this.storePath, `${safeId}.json`);
      const json = JSON.stringify(cookies, null, 2);
      if (!safeStorage.isEncryptionAvailable()) {
        // Fallback to plain JSON if encryption unavailable
        fs.writeFileSync(filePath, json);
        return;
      }
      const encrypted = safeStorage.encryptString(json);
      fs.writeFileSync(filePath, encrypted.toString('base64'));
    } catch {
      console.error(`[CookieStore] Failed to save cookies for ${platform}`);
    }
  }

  async getCookies(platform: string): Promise<any[]> {
    try {
      const safeId = sanitizeId(platform);
      const filePath = path.join(this.storePath, `${safeId}.json`);
      if (!fs.existsSync(filePath)) return [];
      const raw = fs.readFileSync(filePath, 'utf-8');
      // Try encrypted format first, fall back to plain JSON for migration
      try {
        if (!safeStorage.isEncryptionAvailable()) {
          return JSON.parse(raw);
        }
        const encrypted = Buffer.from(raw, 'base64');
        return JSON.parse(safeStorage.decryptString(encrypted));
      } catch {
        // Legacy plain JSON format
        return JSON.parse(raw);
      }
    } catch {
      return [];
    }
  }
}