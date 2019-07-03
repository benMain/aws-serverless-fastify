/// <reference types="node" />
import { Server } from 'http';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
export declare class RequestForwarder {
    static forwardRequestToNodeServer(server: Server, event: APIGatewayProxyEvent, context: Context, resolver: {
        succeed: (data: APIGatewayProxyResult) => void;
    }, binaryTypes: string[]): void;
}
