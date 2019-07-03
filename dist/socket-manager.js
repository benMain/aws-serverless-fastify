"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketManager {
    static getSocketPath(socketPathSuffix) {
        if (/^win/.test(process.platform)) {
            const path = require('path');
            return path.join('\\\\?\\pipe', process.cwd(), `server-${socketPathSuffix}`);
        }
        else {
            return `/tmp/server-${socketPathSuffix}.sock`;
        }
    }
    static getSocketSuffix() {
        return Math.random()
            .toString(36)
            .substring(2, 15);
    }
}
exports.SocketManager = SocketManager;
//# sourceMappingURL=socket-manager.js.map