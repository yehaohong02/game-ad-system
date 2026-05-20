import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

export class BookmarkStore {
  private filePath: string;
  private bookmarks: Bookmark[] = [];

  constructor() {
    const userData = app.getPath('userData');
    this.filePath = path.join(userData, 'bookmarks.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        this.bookmarks = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch {
      this.bookmarks = [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.bookmarks, null, 2));
  }

  getAll(): Bookmark[] {
    return this.bookmarks;
  }

  add(name: string, url: string): Bookmark {
    const bookmark: Bookmark = {
      id: `bm_${Date.now()}`,
      name,
      url,
      createdAt: new Date().toISOString(),
    };
    this.bookmarks.push(bookmark);
    this.save();
    return bookmark;
  }

  delete(id: string): boolean {
    const idx = this.bookmarks.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.bookmarks.splice(idx, 1);
    this.save();
    return true;
  }
}
