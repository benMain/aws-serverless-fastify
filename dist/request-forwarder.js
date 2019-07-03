"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const request_mapper_1 = require("./request-mapper");
const response_builder_1 = require("./response-builder");
class RequestForwarder {
    static forwardRequestToNodeServer(server, event, context, resolver, binaryTypes) {
        try {
            const requestOptions = request_mapper_1.RequestMapper.mapApiGatewayEventToHttpRequest(event, context, server.address().toString());
            const req = http_1.request(requestOptions, response => response_builder_1.ResponseBuilder.buildResponseToApiGateway(response, resolver, binaryTypes));
            if (event.body) {
                const body = request_mapper_1.RequestMapper.getEventBody(event);
                req.write(body);
            }
            req
                .on('error', error => response_builder_1.ResponseBuilder.buildConnectionErrorResponseToApiGateway(error, resolver))
                .end();
        }
        catch (error) {
            response_builder_1.ResponseBuilder.buildLibraryErrorResponseToApiGateway(error, resolver);
        }
    }
}
exports.RequestForwarder = RequestForwarder;
//# sourceMappingURL=request-forwarder.js.map