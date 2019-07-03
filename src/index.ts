import { Server } from 'http';
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { RequestForwarder } from './request-forwarder';
import { SocketManager } from './socket-manager';
import * as fastify from 'fastify';

export function proxy(
  fastifyInstance: fastify.FastifyInstance,
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
      succeed: (data: APIGatewayProxyResult) => {
        return promise.resolve(data);
      },
    };
    binaryTypes = binaryTypes ? binaryTypes.slice() : [];
    if (fastifyInstance.server.listening) {
      RequestForwarder.forwardRequestToNodeServer(
        fastifyInstance.server,
        event,
        context,
        resolver,
        binaryTypes,
      );
    } else {
      const socketSuffix = SocketManager.getSocketSuffix();
      startFastify(fastifyInstance, socketSuffix).on('listening', () =>
        RequestForwarder.forwardRequestToNodeServer(
          fastifyInstance.server,
          event,
          context,
          resolver,
          binaryTypes,
        ),
      );
    }
  });
}

function startFastify(instance: fastify.FastifyInstance, socketSuffix: string): Server {
  instance.listen(SocketManager.getSocketPath(socketSuffix));
  return instance.server;
}
