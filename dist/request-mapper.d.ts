/// <reference types="node" />
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { RequestOptions } from 'http';
export declare class RequestMapper {
    static mapApiGatewayEventToHttpRequest(event: APIGatewayProxyEvent, context: Context, socketPath: string): RequestOptions;
    private static getPathWithQueryStringParams;
    static getEventBody(event: APIGatewayProxyEvent): Buffer;
    private static clone;
}
