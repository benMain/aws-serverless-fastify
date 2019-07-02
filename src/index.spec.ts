import { Server, createServer } from 'http';
import * as fastify from 'fastify';
import { proxy } from './index';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { tmpdir } from 'os';
import { join } from 'path';
import { SocketManager } from './socket-manager';

describe('RequestForwarder', () => {
  let instance: fastify.FastifyInstance;
  let server: Server;
  let event: APIGatewayProxyEvent;
  let context: Context;
  beforeEach(async () => {
    instance = fastify({ logger: true });
    server = instance.server;
    event = buildGetEvent();
    context = buildContext();
  });
  it('forwardRequestToNodeServer(): should forward get request', async () => {
    const exampleResponse = { hello: 'world' };
    const random = SocketManager.getSocketSuffix();
    const sockFile = join(tmpdir(), `${random}server.sock`);
    instance.get('/hello', async (request, reply) => {
      return exampleResponse;
    });
    await instance.listen(sockFile);
    const response = await proxy(server, event, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(exampleResponse);
    expect(response.isBase64Encoded).toEqual(false);
    await instance.close();
  });
});

function buildGetEvent(): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'CloudFront-Forwarded-Proto': 'https',
      'CloudFront-Is-Desktop-Viewer': 'true',
      'CloudFront-Is-Mobile-Viewer': 'false',
      'CloudFront-Is-SmartTV-Viewer': 'false',
      'CloudFront-Is-Tablet-Viewer': 'false',
      'CloudFront-Viewer-Country': 'US',
      'Host': '1234567890.execute-api.us-east-1.amazonaws.com',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Custom User Agent String',
      'Via': '1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)',
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
