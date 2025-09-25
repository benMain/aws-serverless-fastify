import { Server } from 'http';
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
  ALBEvent,
} from 'aws-lambda';
import { RequestForwarder } from './request-forwarder';
import { SocketManager } from './socket-manager';
import * as fastify from 'fastify';

export function proxy(
  fastifyInstance: fastify.FastifyInstance,
  event: APIGatewayProxyEvent | ALBEvent,
  context: Context,
  options?: {
    binaryTypes?: string[];
    useMultiValueHeaders?: boolean;
  },
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
    const binaryTypes = options?.binaryTypes ? options.binaryTypes.slice() : [];
    if (fastifyInstance.server.listening) {
      RequestForwarder.forwardRequestToNodeServer(
        fastifyInstance.server,
        event,
        resolver,
        binaryTypes,
        options?.useMultiValueHeaders ?? false,
      );
    } else {
      const socketSuffix = SocketManager.getSocketSuffix();
      startFastify(fastifyInstance, socketSuffix).on('listening', () =>
        RequestForwarder.forwardRequestToNodeServer(
          fastifyInstance.server,
          event,
          resolver,
          binaryTypes,
          options?.useMultiValueHeaders ?? false,
        ),
      );
    }
  });
}

function startFastify(
  instance: fastify.FastifyInstance,
  socketSuffix: string,
): Server {
  instance.listen({ path: SocketManager.getSocketPath(socketSuffix) });
  return instance.server;
}
