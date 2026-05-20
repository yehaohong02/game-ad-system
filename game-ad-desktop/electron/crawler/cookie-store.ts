import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

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
    const filePath = path.join(this.storePath, `${platform}.json`);
    fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
  }

  async getCookies(platform: string): Promise<any[]> {
    const filePath = path.join(this.storePath, `${platform}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return [];
  }
}
