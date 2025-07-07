import { spawn, ChildProcess } from 'child_process';

export class DevServerManager {
  private serverProcess: ChildProcess | null = null;
  private wasRunning = false;

  async checkIfRunning(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001');
      return response.ok;
    } catch {
      return false;
    }
  }

  async start(): Promise<void> {
    this.wasRunning = await this.checkIfRunning();
    
    if (this.wasRunning) {
      console.log('✅ Dev server already running');
      return;
    }

    console.log('🚀 Starting dev server...');
    
    this.serverProcess = spawn('npm', ['run', 'dev:web'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      detached: false
    });

    // Wait for server to be ready
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (await this.checkIfRunning()) {
        console.log('✅ Dev server started successfully');
        return;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to start dev server within 30 seconds');
  }

  async stop(): Promise<void> {
    if (this.wasRunning) {
      console.log('ℹ️ Dev server was already running, leaving it running');
      return;
    }

    if (this.serverProcess) {
      console.log('🛑 Stopping dev server...');
      
      // Kill the process and all its children
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', this.serverProcess.pid!.toString(), '/f', '/t']);
      } else {
        this.serverProcess.kill('SIGTERM');
      }
      
      this.serverProcess = null;
      console.log('✅ Dev server stopped');
    }
  }
}