import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface PlatformConfig {
  id: string;
  name: string;
  url: string;
  selectors: Record<string, { selector: string; attribute?: string }>;
  createdAt: string;
  lastScrapedAt?: string;
}

export class PlatformConfigStore {
  private filePath: string;
  private configs: Map<string, PlatformConfig> = new Map();

  constructor() {
    const userData = app.getPath('userData');
    this.filePath = path.join(userData, 'platform-configs.json');
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      for (const config of data) {
        this.configs.set(config.id, config);
      }
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify([...this.configs.values()], null, 2));
  }

  getAll(): PlatformConfig[] {
    return [...this.configs.values()];
  }

  get(id: string): PlatformConfig | undefined {
    return this.configs.get(id);
  }

  saveConfig(config: PlatformConfig): void {
    this.configs.set(config.id, config);
    this.save();
  }

  delete(id: string): boolean {
    const deleted = this.configs.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}
