"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class RequestMapper {
    static mapApiGatewayEventToHttpRequest(event, context, socketPath) {
        const headers = Object.assign({}, event.headers);
        if (event.body && !headers['Content-Length']) {
            const body = RequestMapper.getEventBody(event);
            headers['Content-Length'] = Buffer.byteLength(body);
        }
        const clonedEventWithoutBody = RequestMapper.clone(JSON.stringify(event));
        delete clonedEventWithoutBody.body;
        headers['x-apigateway-event'] = encodeURIComponent(JSON.stringify(clonedEventWithoutBody));
        headers['x-apigateway-context'] = encodeURIComponent(JSON.stringify(context));
        return {
            method: event.httpMethod,
            path: RequestMapper.getPathWithQueryStringParams(event),
            headers,
            socketPath,
        };
    }
    static getPathWithQueryStringParams(event) {
        return url_1.format({ pathname: event.path, query: event.queryStringParameters });
    }
    static getEventBody(event) {
        return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    }
    static clone(json) {
        return JSON.parse(JSON.stringify(json));
    }
}
exports.RequestMapper = RequestMapper;
//# sourceMappingURL=request-mapper.js.map