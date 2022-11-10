import { Server } from 'http';
import { fastify, FastifyInstance } from 'fastify';
import { proxy } from './index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { tmpdir } from 'os';
import { join } from 'path';
import { SocketManager } from './socket-manager';

describe('proxy()', () => {
  let instance: FastifyInstance;
  let server: Server;
  let event: APIGatewayProxyEvent;
  let context: Context;
  beforeEach(async () => {
    instance = fastify({ logger: true });
    server = instance.server;
    event = buildGetEvent();
    context = buildContext();
  });
  it('forwardRequestToNodeServer(): should forward get request with listening server', async () => {
    const exampleResponse = { hello: 'world' };
    const random = SocketManager.getSocketSuffix();
    const sockFile = join(tmpdir(), `${random}server.sock`);
    instance.get('/hello', async (request, reply) => {
      return exampleResponse;
    });
    await instance.listen(sockFile);
    const response = await proxy(instance, event, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(exampleResponse);
    expect(response.isBase64Encoded).toEqual(false);
    await instance.close();
  });
  it('forwardRequestToNodeServer(): should forward get request and start not listening server', async () => {
    const exampleResponse = { hello: 'world' };
    instance.get('/hello', async (request, reply) => {
      return exampleResponse;
    });
    const response = await proxy(instance, event, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(exampleResponse);
    expect(response.isBase64Encoded).toEqual(false);
    await instance.close();
  });
  it('forwardRequestToNodeServer(): should forward post request', async () => {
    const postEvent: APIGatewayProxyEvent = buildPostEvent();
    instance.post('/post-test', async (request, reply) => {
      return { hello: (request.body as any).name };
    });
    const response = await proxy(instance, postEvent, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body).hello).toEqual(
      JSON.parse(postEvent.body).name,
    );
    expect(response.isBase64Encoded).toEqual(false);
    await instance.close();
  });

  it('forwardRequestToNodeServer(): should respond with 404 when endpoint not found', async () => {
    const exampleResponse = { hello: 'world' };
    instance.get('/incorrect', async (request, reply) => {
      return exampleResponse;
    });
    const response = await proxy(instance, event, context);
    expect(response.statusCode).toEqual(404);
    await instance.close();
  });
});

function buildGetEvent(): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'CloudFront-Forwarded-Proto': 'https',
      'CloudFront-Is-Desktop-Viewer': 'true',
      'CloudFront-Is-Mobile-Viewer': 'false',
      'CloudFront-Is-SmartTV-Viewer': 'false',
      'CloudFront-Is-Tablet-Viewer': 'false',
      'CloudFront-Viewer-Country': 'US',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Custom User Agent String',
      'X-Amz-Cf-Id': 'cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==',
      'X-Forwarded-For': '127.0.0.1, 127.0.0.2',
      'X-Forwarded-Port': '443',
      'X-Forwarded-Proto': 'http',
    },
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/hello',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: null,
    resource: null,
  };
}

function buildContext(): Context {
  return {
    functionName: null,
    callbackWaitsForEmptyEventLoop: null,
    functionVersion: null,
    invokedFunctionArn: null,
    awsRequestId: null,
    logGroupName: null,
    logStreamName: null,
    memoryLimitInMB: 1024,
    getRemainingTimeInMillis: () => 1000,
    done: (error?: Error, result?: any) => null,
    fail: (error: Error | string) => null,
    /* tslint:disable:no-empty */

    succeed: () => {},
  };
}

function buildPostEvent(): APIGatewayProxyEvent {
  return {
    body: '{ "name": "Ben" }',
    headers: {
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'CloudFront-Forwarded-Proto': 'https',
      'CloudFront-Is-Desktop-Viewer': 'true',
      'CloudFront-Is-Mobile-Viewer': 'false',
      'CloudFront-Is-SmartTV-Viewer': 'false',
      'CloudFront-Is-Tablet-Viewer': 'false',
      'CloudFront-Viewer-Country': 'US',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Custom User Agent String',
      'X-Amz-Cf-Id': 'cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==',
      'X-Forwarded-For': '127.0.0.1, 127.0.0.2',
      'X-Forwarded-Port': '443',
      'X-Forwarded-Proto': 'http',
      'Content-Type': 'application/json',
    },
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/post-test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: null,
    resource: null,
  };
}
