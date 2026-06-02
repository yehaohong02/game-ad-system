import { safeStorage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { sanitizeId } from '../utils';

export class CredentialStore {
  private storePath: string;

  constructor() {
    const userData = app.getPath('userData');
    this.storePath = path.join(userData, 'credentials');
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  saveCredentials(platformId: string, credentials: { username: string; password: string }): void {
    const safeId = sanitizeId(platformId);
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available on this system');
    }
    const encrypted = safeStorage.encryptString(JSON.stringify(credentials));
    fs.writeFileSync(path.join(this.storePath, `${safeId}.json`), encrypted.toString('base64'));
  }

  getCredentials(platformId: string): { username: string; password: string } | null {
    try {
      const safeId = sanitizeId(platformId);
      const filePath = path.join(this.storePath, `${safeId}.json`);
      if (!fs.existsSync(filePath)) return null;
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this system');
      }
      const encrypted = Buffer.from(fs.readFileSync(filePath, 'utf-8'), 'base64');
      return JSON.parse(safeStorage.decryptString(encrypted));
    } catch {
      return null;
    }
  }

  deleteCredentials(platformId: string): void {
    const safeId = sanitizeId(platformId);
    const filePath = path.join(this.storePath, `${safeId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}