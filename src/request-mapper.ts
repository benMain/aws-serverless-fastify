import { ALBEvent, APIGatewayProxyEvent, Context } from 'aws-lambda';
import { format } from 'url';
import { RequestOptions } from 'http';

export class RequestMapper {
  public static mapApiGatewayEventToHttpRequest(
    event: APIGatewayProxyEvent | ALBEvent,
    context: Context,
    socketPath: string,
  ): RequestOptions {
    const headers: { [name: string]: any } = {
      ...event.headers,
      ...RequestMapper.reduceArrayProperties(event.multiValueHeaders),
    };

    if (event.body && !headers['Content-Length']) {
      const body = RequestMapper.getEventBody(event);
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    return {
      method: event.httpMethod,
      path: RequestMapper.getPathWithQueryStringParams(event),
      headers,
      socketPath,
    };
  }

  private static getPathWithQueryStringParams(
    event: APIGatewayProxyEvent | ALBEvent,
  ): string {
    return format({
      pathname: event.path,
      query: event?.multiValueQueryStringParameters
        ? RequestMapper.reduceArrayProperties(
            event?.multiValueQueryStringParameters,
          )
        : event.queryStringParameters,
    });
  }

  private static reduceArrayProperties(
    obj: { [name: string]: string[] } | undefined,
  ): {
    [name: string]: string | string[];
  } {
    const response = {};
    if (!obj) {
      return response;
    }
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      response[key] = value.length > 1 ? value : value[0];
    });
    return response;
  }

  public static getEventBody(event: APIGatewayProxyEvent | ALBEvent): Buffer {
    return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
  }
}
