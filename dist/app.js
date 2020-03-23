"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("graphql-import-node");
const apollo_server_express_1 = require("apollo-server-express");
const gateway_1 = require("@apollo/gateway");
const express_1 = __importDefault(require("express"));
const restProxy_1 = require("./util/restProxy");
const misc_1 = require("./util/misc");
class AuthenticatedDataSource extends gateway_1.RemoteGraphQLDataSource {
    willSendRequest({ request, context }) {
        if (context.user !== undefined) {
            request.http.headers.set('user', JSON.stringify(context.user));
        }
    }
}
function createGateway(services) {
    const graphqlUrls = services.map((s) => {
        return { name: s.name, url: misc_1.appendUrl(s.url, "graphql") };
    });
    const gateway = new gateway_1.ApolloGateway({
        serviceList: graphqlUrls,
        buildService: ({ url }) => new AuthenticatedDataSource({ url })
    });
    const isPlaygroundActive = process.env.NODE_ENV !== "production";
    return new apollo_server_express_1.ApolloServer({
        gateway,
        subscriptions: false,
        context: ({ res }) => ({ user: res.locals.user }),
        playground: isPlaygroundActive
    });
}
const createApp = (services, addMiddleware) => {
    const app = express_1.default();
    const port = process.env.PORT || 3000;
    app.set("port", port);
    addMiddleware(app);
    const apolloServer = createGateway(services);
    apolloServer.applyMiddleware({ app, cors: true });
    restProxy_1.configureRestProxies(app, services);
    app.get("/healthz", (req, res) => {
        res.send("ok");
    });
    return app;
};
exports.default = createApp;
//# sourceMappingURL=app.js.map