import { createServer, RequestListener, Server } from 'http';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { RequestForwarder } from './request-forwarder';
import { SocketManager } from './socket-manager';
import { FastifyServerContainer } from './fastify-server-container';

export function createProxyServer(
  requestListener: RequestListener,
  serverListenCallback?: () => any,
  binaryTypes?: string[],
): FastifyServerContainer {
  const server = createServer(requestListener);

  let socketSuffix = SocketManager.getSocketSuffix();
  const binaryTypesAll: string[] = binaryTypes ? binaryTypes.slice() : [];
  server.on('listening', () => {
    server.listening = true;

    if (serverListenCallback) {
      serverListenCallback();
    }
  });
  server
    .on('close', () => {
      server.listening = false;
    })
    .on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        // tslint:disable-next-line: no-console
        console.warn(
          `WARNING: Attempting to listen on socket ${SocketManager.getSocketPath(
            socketSuffix,
          )}, but it is already in use. This is likely as a result of a previous invocation error or timeout. Check the logs for the invocation(s) immediately prior to this for root cause, and consider increasing the timeout and/or cpu/memory allocation if this is purely as a result of a timeout. aws-serverless-express will restart the Node.js server listening on a new port and continue with this request.`,
        );
        socketSuffix = SocketManager.getSocketSuffix();
        return server.close(() => startServer(server, socketSuffix));
      } else {
        // tslint:disable-next-line: no-console
        console.log('ERROR: server error');
        // tslint:disable-next-line: no-console
        console.error(error);
      }
    });

  return { server, socketSuffix, binaryTypes };
}

export function proxy(
  serverContainer: FastifyServerContainer,
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const promise = {
      resolve,
      reject,
    };
    const resolver = {
      succeed: (serverResponse: { response: any }) => {
        return promise.resolve(serverResponse.response);
      },
    };

    if (serverContainer.server.listening) {
      RequestForwarder.forwardRequestToNodeServer(
        serverContainer,
        event,
        context,
        resolver,
      );
    } else {
      startServer(serverContainer.server, serverContainer.socketSuffix).on(
        'listening',
        () =>
          RequestForwarder.forwardRequestToNodeServer(
            serverContainer,
            event,
            context,
            resolver,
          ),
      );
    }
  });
}

function startServer(server: Server, socketSuffix: string): Server {
  return server.listen(SocketManager.getSocketPath(socketSuffix));
}
