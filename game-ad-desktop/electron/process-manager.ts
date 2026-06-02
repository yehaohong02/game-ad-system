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
  private isShuttingDown: boolean = false;

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
      // Don't restart on clean exit (code 0) or during shutdown
      if (code === 0 || this.isShuttingDown) return;
      const count = this.restartCounts.get(svc.name) || 0;
      if (count < svc.maxRestarts) {
        this.restartCounts.set(svc.name, count + 1);
        const delay = Math.min(1000 * Math.pow(2, count), 30000);
        setTimeout(() => {
          if (!this.isShuttingDown) {
            this.startService(svc, baseDir);
          }
        }, delay);
      }
    });

    this.processes.set(svc.name, proc);
    if (!this.initiallyStarted.has(svc.name)) {
      this.initiallyStarted.add(svc.name);
      this.restartCounts.set(svc.name, 0);
    }

    await this.waitForPort(svc.port, 30000);

    // Reset restart counter after 60s of successful running
    setTimeout(() => {
      if (this.processes.get(svc.name) === proc && proc.exitCode === null) {
        this.restartCounts.set(svc.name, 0);
      }
    }, 60000);
  }

  private waitForPort(port: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = (socket: net.Socket) => {
        socket.destroy();
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const check = () => {
        const socket = new net.Socket();
        socket.connect(port, '127.0.0.1', () => {
          cleanup(socket);
          resolve();
        });
        socket.on('error', () => {
          cleanup(socket);
          if (Date.now() - start > timeout) {
            reject(new Error(`Port ${port} timeout after ${timeout}ms`));
          } else {
            timeoutId = setTimeout(check, 500);
          }
        });
      };
      check();
    });
  }

  async stopAll(): Promise<void> {
    this.isShuttingDown = true;
    const exitPromises: Promise<void>[] = [];
    for (const [name, proc] of this.processes) {
      const p = new Promise<void>((resolve) => {
        // If already exited, resolve immediately
        if (proc.exitCode !== null) {
          resolve();
        } else {
          proc.on('exit', () => resolve());
          proc.kill('SIGTERM');
          // Force-kill with SIGKILL after 5 seconds if still alive
          setTimeout(() => {
            if (proc.exitCode === null) {
              proc.kill('SIGKILL');
            }
          }, 5000);
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