import { Server } from 'http';
import { APIGatewayProxyResult } from 'aws-lambda';
import { is } from 'type-is';
import * as binarycase from 'binary-case';

export class ResponseForwarder {
  public static forwardResponseToApiGateway(
    response,
    resolver: { succeed: (arg0: { response: APIGatewayProxyResult }) => void },
    binaryTypes: string[],
  ) {
    const buf = [];

    response
      .on('data', (chunk: any) => buf.push(chunk))
      .on('end', () => {
        const bodyBuffer = Buffer.concat(buf);
        const statusCode = response.statusCode;
        const headers = response.headers;

        if (headers['transfer-encoding'] === 'chunked') {
          delete headers['transfer-encoding'];
        }

        // HACK: modifies header casing to get around API Gateway's limitation of not allowing multiple
        // headers with the same name, as discussed on the AWS Forum https://forums.aws.amazon.com/message.jspa?messageID=725953#725953
        Object.keys(headers).forEach(h => {
          if (Array.isArray(headers[h])) {
            if (h.toLowerCase() === 'set-cookie') {
              headers[h].forEach((value: any, i: number) => {
                headers[binarycase(h, i + 1)] = value;
              });
              delete headers[h];
            } else {
              headers[h] = headers[h].join(',');
            }
          }
        });

        const contentType = ResponseForwarder.getContentType({
          contentTypeHeader: headers['content-type'],
        });
        const isBase64Encoded = ResponseForwarder.isContentTypeBinaryMimeType({
          contentType,
          binaryMimeTypes: binaryTypes,
        });
        const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8');
        const successResponse = { statusCode, body, headers, isBase64Encoded };

        resolver.succeed({ response: successResponse });
      });
  }

  public static forwardConnectionErrorResponseToApiGateway(
    error: Error,
    resolver: {
      succeed: (arg0: {
        response: { statusCode: number; body: string; headers: {} };
      }) => void;
    },
  ) {
    // tslint:disable-next-line: no-console
    console.log('ERROR: aws-serverless-fastify connection error');
    // tslint:disable-next-line: no-console
    console.error(error);
    const errorResponse = {
      statusCode: 502,
      body: '',
      headers: {},
    };

    resolver.succeed({ response: errorResponse });
  }

  public static forwardLibraryErrorResponseToApiGateway(
    error: Error,
    resolver: {
      succeed: (arg0: {
        response: { statusCode: number; body: string; headers: {} };
      }) => void;
    },
  ) {
    console.log('ERROR: aws-serverless-express error');
    console.error(error);
    const errorResponse = {
      statusCode: 500,
      body: '',
      headers: {},
    };

    resolver.succeed({ response: errorResponse });
  }

  private static getContentType(params: { contentTypeHeader: any }) {
    // only compare mime type; ignore encoding part
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
