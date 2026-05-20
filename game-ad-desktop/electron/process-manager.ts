import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import * as path from 'path';
import * as net from 'net';
import * as fs from 'fs';

interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  port: number;
  healthUrl?: string;
  maxRestarts: number;
}

export class ProcessManager {
  private processes: Map<string, ChildProcess> = new Map();
  private restartCounts: Map<string, number> = new Map();
  private initiallyStarted: Set<string> = new Set();
  private services: ServiceConfig[];

  constructor(services: ServiceConfig[]) {
    this.services = services;
  }

  async startAll(): Promise<void> {
    const isPackaged = app.isPackaged;
    const baseDir = isPackaged ? process.resourcesPath : __dirname;

    for (const svc of this.services) {
      await this.startService(svc, baseDir);
    }
  }

  private async startService(svc: ServiceConfig, baseDir: string): Promise<void> {
    const cmd = path.resolve(baseDir, svc.command);

    if (!fs.existsSync(cmd)) {
      console.warn(`[ProcessManager] Skipping ${svc.name}: executable not found at ${cmd}`);
      return;
    }

    const proc = spawn(cmd, svc.args, {
      cwd: baseDir,
      stdio: 'pipe',
      windowsHide: true,
    });

    proc.on('error', (err) => {
      console.error(`[ProcessManager] ${svc.name} spawn error: ${err.message}`);
    });

    proc.on('exit', (code) => {
      const count = this.restartCounts.get(svc.name) || 0;
      if (count < svc.maxRestarts) {
        this.restartCounts.set(svc.name, count + 1);
        const delay = Math.min(1000 * Math.pow(2, count), 30000);
        setTimeout(() => this.startService(svc, baseDir), delay);
      }
    });

    this.processes.set(svc.name, proc);
    if (!this.initiallyStarted.has(svc.name)) {
      this.initiallyStarted.add(svc.name);
      this.restartCounts.set(svc.name, 0);
    }

    await this.waitForPort(svc.port, 30000);
  }

  private waitForPort(port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        const socket = new net.Socket();
        socket.connect(port, '127.0.0.1', () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', () => {
          socket.destroy();
          if (Date.now() - start > timeout) {
            reject(new Error(`Port ${port} timeout after ${timeout}ms`));
          } else {
            setTimeout(check, 500);
          }
        });
      };
      check();
    });
  }

  async stopAll(): Promise<void> {
    const exitPromises: Promise<void>[] = [];
    for (const [name, proc] of this.processes) {
      const p = new Promise<void>((resolve) => {
        proc.on('exit', () => resolve());
        proc.kill('SIGTERM');
        // If already exited, resolve immediately
        if (proc.exitCode !== null) {
          resolve();
        }
      });
      exitPromises.push(p);
    }
    await Promise.all(exitPromises);
    this.processes.clear();
  }

  getStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    for (const [name, proc] of this.processes) {
      status[name] = proc.exitCode === null ? 'running' : `exited(${proc.exitCode})`;
    }
    return status;
  }
}
