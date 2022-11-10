import { request, Server, RequestOptions } from 'http';
import {
  APIGatewayProxyEvent,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { RequestMapper } from './request-mapper';
import { ResponseBuilder } from './response-builder';

export class RequestForwarder {
  public static forwardRequestToNodeServer(
    server: Server,
    event: APIGatewayProxyEvent,
    context: Context,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
    binaryTypes: string[],
  ): void {
    try {
      const requestOptions: RequestOptions =
        RequestMapper.mapApiGatewayEventToHttpRequest(
          event,
          context,
          server.address().toString(),
        );
      const req = request(requestOptions, (response) =>
        ResponseBuilder.buildResponseToApiGateway(
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
        .on('error', (error) =>
          ResponseBuilder.buildConnectionErrorResponseToApiGateway(
            error,
            resolver,
          ),
        )
        .end();
    } catch (error) {
      ResponseBuilder.buildLibraryErrorResponseToApiGateway(error, resolver);
    }
  }
}
