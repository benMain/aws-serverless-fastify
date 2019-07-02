import { request } from 'http';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { RequestMapper } from './request-mapper';
import { SocketManager } from './socket-manager';
import { ResponseForwarder } from './response-forwarder';
import { FastifyServerContainer } from './fastify-server-container';

export class RequestForwarder {
  public static forwardRequestToNodeServer(
    serverContainer: FastifyServerContainer,
    event: APIGatewayProxyEvent,
    context: Context,
    resolver: { succeed: (params2: any) => any },
  ): FastifyServerContainer {
    try {
      const requestOptions = RequestMapper.mapApiGatewayEventToHttpRequest(
        event,
        context,
        SocketManager.getSocketPath(serverContainer.socketSuffix),
      );
      const req = request(requestOptions, response =>
        ResponseForwarder.forwardResponseToApiGateway(
          response,
          resolver,
          serverContainer.binaryTypes,
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
      return serverContainer;
    }
  }
}
