import { request, Server, RequestOptions } from 'http';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  ALBEvent,
} from 'aws-lambda';
import { RequestMapper } from './request-mapper';
import { ResponseBuilder } from './response-builder';

export class RequestForwarder {
  public static forwardRequestToNodeServer(
    server: Server,
    event: APIGatewayProxyEvent | ALBEvent,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
    binaryTypes: string[],
    useMultiValueHeaders: boolean,
  ): void {
    try {
      const requestOptions: RequestOptions =
        RequestMapper.mapApiGatewayEventToHttpRequest(
          event,
          server.address().toString(),
          useMultiValueHeaders,
        );
      const req = request(requestOptions, (response) =>
        ResponseBuilder.buildResponseToApiGateway(
          response,
          resolver,
          binaryTypes,
          useMultiValueHeaders,
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
