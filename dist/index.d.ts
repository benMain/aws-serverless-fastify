/// <reference types="node" />
import { Server } from 'http';
import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
export declare function proxy(server: Server, event: APIGatewayProxyEvent, context: Context, binaryTypes?: string[]): Promise<APIGatewayProxyResult>;
