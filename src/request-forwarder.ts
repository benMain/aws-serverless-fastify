import { request, Server } from 'http';
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { RequestMapper } from './request-mapper';
import { SocketManager } from './socket-manager';
import { ResponseForwarder } from './response-forwarder';
import { AddressInfo } from 'net';

export class RequestForwarder {
  public static forwardRequestToNodeServer(
    server: Server,
    event: APIGatewayProxyEvent,
    context: Context,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
    binaryTypes: string[],
  ): void {
    try {
      const requestOptions = RequestMapper.mapApiGatewayEventToHttpRequest(
        event,
        context,
        SocketManager.getSocketPath(
          (server.address() as AddressInfo).port.toString(),
        ),
      );
      const req = request(requestOptions, response =>
        ResponseForwarder.forwardResponseToApiGateway(
          response,
          resolver,
          binaryTypes,
        ),
      );
      if (event.body) {
        const body = RequestMapper.getEventBody(event);
        req.write(body);
      }
      req
        .on('error', error =>
          ResponseForwarder.forwardConnectionErrorResponseToApiGateway(
            error,
            resolver,
          ),
        )
        .end();
    } catch (error) {
      ResponseForwarder.forwardLibraryErrorResponseToApiGateway(
        error,
        resolver,
      );
    }
  }
}
