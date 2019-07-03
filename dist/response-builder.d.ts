/// <reference types="node" />
import { IncomingMessage } from 'http';
import { APIGatewayProxyResult } from 'aws-lambda';
export declare class ResponseBuilder {
    static buildResponseToApiGateway(response: IncomingMessage, resolver: {
        succeed: (data: APIGatewayProxyResult) => void;
    }, binaryTypes: string[]): void;
    static buildConnectionErrorResponseToApiGateway(error: Error, resolver: {
        succeed: (data: APIGatewayProxyResult) => void;
    }): void;
    static buildLibraryErrorResponseToApiGateway(error: Error, resolver: {
        succeed: (data: APIGatewayProxyResult) => void;
    }): void;
    private static getContentType;
    private static isContentTypeBinaryMimeType;
}
