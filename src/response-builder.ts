import { IncomingMessage } from 'http';
import { APIGatewayProxyResult } from 'aws-lambda';
import { is } from 'type-is';

export class ResponseBuilder {
  public static buildResponseToApiGateway(
    response: IncomingMessage,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
    binaryTypes: string[],
  ) {
    const buf = [];

    response
      .on('data', (chunk: any) => buf.push(chunk))
      .on('end', () => {
        const bodyBuffer = Buffer.concat(buf);
        const statusCode = response.statusCode;
        const mixedHeaders = response.headers as
          | APIGatewayProxyResult['headers']
          | APIGatewayProxyResult['multiValueHeaders'];

        const headers: APIGatewayProxyResult['headers'] = {};
        const multiValueHeaders: APIGatewayProxyResult['multiValueHeaders'] = {};

        for (const [key, value] of Object.entries(mixedHeaders)) {
          if (Array.isArray(value)) {
            multiValueHeaders[key] = value;
          } else {
            headers[key] = value;
          }
        }

        if (headers['transfer-encoding'] === 'chunked') {
          delete headers['transfer-encoding'];
        }

        const contentType = ResponseBuilder.getContentType({
          contentTypeHeader: headers['content-type'],
        });
        const isBase64Encoded = ResponseBuilder.isContentTypeBinaryMimeType({
          contentType,
          binaryMimeTypes: binaryTypes,
        });
        const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8');
        const successResponse: APIGatewayProxyResult = {
          statusCode,
          body,
          headers,
          multiValueHeaders,
          isBase64Encoded,
        };

        resolver.succeed(successResponse);
      });
  }

  public static buildConnectionErrorResponseToApiGateway(
    error: Error,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
  ) {
    // tslint:disable-next-line: no-console
    console.log('ERROR: aws-serverless-fastify connection error');
    // tslint:disable-next-line: no-console
    console.error(error);
    const errorResponse: APIGatewayProxyResult = {
      statusCode: 502,
      body: '',
      headers: {},
    };
    resolver.succeed(errorResponse);
  }

  public static buildLibraryErrorResponseToApiGateway(
    error: Error,
    resolver: { succeed: (data: APIGatewayProxyResult) => void },
  ) {
    // tslint:disable-next-line: no-console
    console.log('ERROR: aws-serverless-fastify error');
    // tslint:disable-next-line: no-console
    console.error(error);
    const errorResponse: APIGatewayProxyResult = {
      statusCode: 500,
      body: '',
      headers: {},
    };
    resolver.succeed(errorResponse);
  }

  private static getContentType(params: { contentTypeHeader: any }) {
    return params.contentTypeHeader
      ? params.contentTypeHeader.split(';')[0]
      : '';
  }

  private static isContentTypeBinaryMimeType(params: {
    contentType: any;
    binaryMimeTypes: any;
  }) {
    return (
      params.binaryMimeTypes.length > 0 &&
      !!is(params.contentType, params.binaryMimeTypes)
    );
  }
}
