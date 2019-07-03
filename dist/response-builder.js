"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_is_1 = require("type-is");
const binarycase = require("binary-case");
class ResponseBuilder {
    static buildResponseToApiGateway(response, resolver, binaryTypes) {
        const buf = [];
        response
            .on('data', (chunk) => buf.push(chunk))
            .on('end', () => {
            const bodyBuffer = Buffer.concat(buf);
            const statusCode = response.statusCode;
            const headers = response.headers;
            if (headers['transfer-encoding'] === 'chunked') {
                delete headers['transfer-encoding'];
            }
            Object.keys(headers).forEach(h => {
                if (Array.isArray(h)) {
                    if (h.toLowerCase() === 'set-cookie') {
                        h.forEach((value, i) => {
                            headers[binarycase(h, i + 1)] = value;
                        });
                        delete headers[h];
                    }
                    else {
                        headers[h] = h.join(',');
                    }
                }
            });
            const contentType = ResponseBuilder.getContentType({
                contentTypeHeader: headers['content-type'],
            });
            const isBase64Encoded = ResponseBuilder.isContentTypeBinaryMimeType({
                contentType,
                binaryMimeTypes: binaryTypes,
            });
            const body = bodyBuffer.toString(isBase64Encoded ? 'base64' : 'utf8');
            const successResponse = {
                statusCode,
                body,
                headers,
                isBase64Encoded,
            };
            resolver.succeed(successResponse);
        });
    }
    static buildConnectionErrorResponseToApiGateway(error, resolver) {
        console.log('ERROR: aws-serverless-fastify connection error');
        console.error(error);
        const errorResponse = {
            statusCode: 502,
            body: '',
            headers: {},
        };
        resolver.succeed(errorResponse);
    }
    static buildLibraryErrorResponseToApiGateway(error, resolver) {
        console.log('ERROR: aws-serverless-fastify error');
        console.error(error);
        const errorResponse = {
            statusCode: 500,
            body: '',
            headers: {},
        };
        resolver.succeed(errorResponse);
    }
    static getContentType(params) {
        return params.contentTypeHeader
            ? params.contentTypeHeader.split(';')[0]
            : '';
    }
    static isContentTypeBinaryMimeType(params) {
        return (params.binaryMimeTypes.length > 0 &&
            !!type_is_1.is(params.contentType, params.binaryMimeTypes));
    }
}
exports.ResponseBuilder = ResponseBuilder;
//# sourceMappingURL=response-builder.js.map