import { Server } from 'http';
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { RequestForwarder } from './request-forwarder';
import { SocketManager } from './socket-manager';

export function proxy(
  server: Server,
  event: APIGatewayProxyEvent,
  context: Context,
  binaryTypes?: string[],
): Promise<APIGatewayProxyResult> {
  return new Promise<APIGatewayProxyResult>((resolve, reject) => {
    const promise = {
      resolve,
      reject,
    };
    const resolver = {
      succeed: (data: APIGatewayProxyResult ) => {
        return promise.resolve(data);
      },
    };
    binaryTypes = binaryTypes ? binaryTypes.slice() : [];
    if (server.listening) {
      RequestForwarder.forwardRequestToNodeServer(
        server,
        event,
        context,
        resolver,
        binaryTypes,
      );
    } else {
      const socketSuffix = SocketManager.getSocketSuffix();
      startServer(server, socketSuffix).on('listening', () =>
        RequestForwarder.forwardRequestToNodeServer(
          server,
          event,
          context,
          resolver,
          binaryTypes,
        ),
      );
    }
  });
}

function startServer(server: Server, socketSuffix: string): Server {
  return server.listen(SocketManager.getSocketPath(socketSuffix));
}
