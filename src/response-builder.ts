import { IncomingMessage } from 'http';
import { APIGatewayProxyResult } from 'aws-lambda';
import { is } from 'type-is';
import * as binarycase from 'binary-case';

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
        const headers = response.headers as {
          [header: string]: string | number | boolean;
        };

        if (headers['transfer-encoding'] === 'chunked') {
          delete headers['transfer-encoding'];
        }

        // HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
        // headers with the same name, as discussed on the AWS Forum https://forums.aws.amazon.com/message.jspa?messageID=725953#725953
        Object.keys(headers).forEach((h) => {
          if (Array.isArray(h)) {
            if (h.toLowerCase() === 'set-cookie') {
              h.forEach((value: any, i: number) => {
                headers[binarycase(h, i + 1)] = value;
              });
              delete headers[h];
            } else {
              headers[h] = h.join(',');
            }
          }
        });

        const contentType = ResponseBuilder.getContentType({
          contentTypeHeader: headers['content-type'],
        });
        let isBase64Encoded = ResponseBuilder.isContentTypeBinaryMimeType({
          contentType,
          binaryMimeTypes: binaryTypes,
        });
        if (!isBase64Encoded) {
          isBase64Encoded = headers['content-encoding'] === 'gzip';
        }
        const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8');
        const successResponse: APIGatewayProxyResult = {
          statusCode,
          body,
          headers,
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
