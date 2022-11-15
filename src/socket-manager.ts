export class SocketManager {
  public static getSocketPath(socketPathSuffix: string): string {
    if (/^win/.test(process.platform)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      return path.join(
        '\\\\?\\pipe',
        process.cwd(),
        `server-${socketPathSuffix}`,
      );
    } else {
      return `/tmp/server-${socketPathSuffix}.sock`;
    }
  }

  public static getSocketSuffix(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
