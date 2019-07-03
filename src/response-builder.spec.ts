import { ResponseBuilder } from './response-builder';
import { APIGatewayProxyResult } from 'aws-lambda';

describe('ResponseBuilder', () => {

    it('buildConnectionErrorResponseToApiGateway(): should build valid gateway response', () => {
        const resolver: any =  {
            cache : null,
            succeed(data: APIGatewayProxyResult) {
                this.cache = data;
            },
        };
        const error = new Error('Connection error!');
        ResponseBuilder.buildConnectionErrorResponseToApiGateway(error, resolver);
        expect(resolver.cache.statusCode).toEqual(502);
    });

    it('buildLibraryErrorResponseToApiGateway(): should build valid gateway response', () => {
        const resolver: any =  {
            cache : null,
            succeed(data: APIGatewayProxyResult) {
                this.cache = data;
            },
        };
        const error = new Error('Connection error!');
        ResponseBuilder.buildLibraryErrorResponseToApiGateway(error, resolver);
        expect(resolver.cache.statusCode).toEqual(500);
    });
});
