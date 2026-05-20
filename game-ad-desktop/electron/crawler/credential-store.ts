import { safeStorage, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

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
    const encrypted = safeStorage.encryptString(JSON.stringify(credentials));
    fs.writeFileSync(path.join(this.storePath, `${platformId}.json`), encrypted.toString('base64'));
  }

  getCredentials(platformId: string): { username: string; password: string } | null {
    const filePath = path.join(this.storePath, `${platformId}.json`);
    if (!fs.existsSync(filePath)) return null;
    const encrypted = Buffer.from(fs.readFileSync(filePath, 'utf-8'), 'base64');
    return JSON.parse(safeStorage.decryptString(encrypted));
  }

  deleteCredentials(platformId: string): void {
    const filePath = path.join(this.storePath, `${platformId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}
