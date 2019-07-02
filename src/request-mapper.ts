import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { format } from 'url';
import { RequestOptions } from 'http';

export class RequestMapper {
  public static mapApiGatewayEventToHttpRequest(
    event: APIGatewayProxyEvent,
    context: Context,
    socketPath: string,
  ): RequestOptions {
    const headers: { [name: string]: any } = Object.assign({}, event.headers);

    if (event.body && !headers['Content-Length']) {
      const body = RequestMapper.getEventBody(event);
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const clonedEventWithoutBody = RequestMapper.clone(JSON.stringify(event));
    delete clonedEventWithoutBody.body;

    headers['x-apigateway-event'] = encodeURIComponent(
      JSON.stringify(clonedEventWithoutBody),
    );
    headers['x-apigateway-context'] = encodeURIComponent(
      JSON.stringify(context),
    );

    return {
      method: event.httpMethod,
      path: RequestMapper.getPathWithQueryStringParams(event),
      headers,
      socketPath,
    };
  }

  private static getPathWithQueryStringParams(
    event: APIGatewayProxyEvent,
  ): string {
    return format({ pathname: event.path, query: event.queryStringParameters });
  }

  public static getEventBody(event: APIGatewayProxyEvent): Buffer {
    return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
  }

  private static clone(json: string): any {
    return JSON.parse(JSON.stringify(json));
  }
}
