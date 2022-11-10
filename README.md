# AWS-SERVERLESS-FASTIFY

<p align="center">
  <a href="https://docs.aws.amazon.com/lambda/latest/dg/with-on-demand-https.html" target="blank"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_J7FdTrTevEYb1SKKWlcxc3xKVXR6x7oBG7jHh0e8P5Ev_IN-Aw" width="320" alt="Nest Logo" /></a>
</p>

## Description

A port of the AWSLABS [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) library tailor made for the
[Fastify](https://www.fastify.io/) web framework. Inspired by wanting to use the Fastify gracefully in [Nest](https://docs.nestjs.com/) projects with Lambda. Plus it's called Fastify, how cool is that!

## Nest Compatibility

Version 1.x.x compatible with nestjs 7.
Version 2.x.x compatible with nestjs 8.

## Installation

```bash
$ npm install aws-serverless-fastify
```

## Examples

### Nest

Nest example is provided [here](https://github.com/benMain/aws-serverless-fastify-nest-example). Below is the summary.

lambda-entrypoint.ts (I think the lambda-entrypoint.ts is much cleaner than what is proposed by [Fastify](https://github.com/fastify/fastify/blob/master/docs/Serverless.md))

```typescript
import {
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { bootstrap } from './app';
import * as fastify from 'fastify';
import { proxy } from 'aws-serverless-fastify';

let fastifyServer: fastify.FastifyInstance;

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  if (!fastifyServer) {
    fastifyServer = await bootstrap();
  }
  return await proxy(fastifyServer, event, context);
};
```

app.ts (Setup the application once in app.ts)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as fastify from 'fastify';

export async function bootstrap(): Promise<fastify.FastifyInstance> {
  const serverOptions: fastify.ServerOptionsAsHttp = {
    logger: true,
  };
  const instance: fastify.FastifyInstance = fastify(serverOptions);
  const nestApp = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(instance),
  );
  nestApp.setGlobalPrefix('api');
  nestApp.enableCors();
  await nestApp.init();
  return instance;
}
```

main.ts (Will still serve to run the Nest App locally)

```typescript
import { bootstrap } from './app';

async function startLocal() {
  const fastifyInstance = await bootstrap();
  fastifyInstance.listen(3000);
}

startLocal();
```

## Performance

Not meant to be exhaustive by any means but here are some basic load tests comparisons through API Gateway via [Artillery](https://artillery.io/). [aws-serverless-fastify](https://benMain.github.io/aws-serverless-fastify/performance/aws-serverless-fastify-results.html) versus [aws-serverless-express](https://benMain.github.io/aws-serverless-fastify/performance/aws-serverless-express-results.html)

## Support

Pull Requests are welcome! We just thought this was a cool idea to simplify!
Important: Commits should follow Angluar conventional-changelog format :)

## Stay in touch

- Author - [Benjamin Main](mailto:bmain@lumeris.com)

## License

aws-serverless-fastify is [MIT licensed](LICENSE).
