"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_forwarder_1 = require("./request-forwarder");
const socket_manager_1 = require("./socket-manager");
function proxy(server, event, context, binaryTypes) {
    return new Promise((resolve, reject) => {
        const promise = {
            resolve,
            reject,
        };
        const resolver = {
            succeed: (data) => {
                return promise.resolve(data);
            },
        };
        binaryTypes = binaryTypes ? binaryTypes.slice() : [];
        if (server.listening) {
            request_forwarder_1.RequestForwarder.forwardRequestToNodeServer(server, event, context, resolver, binaryTypes);
        }
        else {
            const socketSuffix = socket_manager_1.SocketManager.getSocketSuffix();
            startServer(server, socketSuffix).on('listening', () => request_forwarder_1.RequestForwarder.forwardRequestToNodeServer(server, event, context, resolver, binaryTypes));
        }
    });
}
exports.proxy = proxy;
function startServer(server, socketSuffix) {
    return server.listen(socket_manager_1.SocketManager.getSocketPath(socketSuffix));
}
//# sourceMappingURL=index.js.map