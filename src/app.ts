import 'graphql-import-node';
import { ApolloServer } from "apollo-server-express";
import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import express, { Express, Request, Response } from "express";
import { configureRestProxies } from "./util/restProxy";
import { appendUrl, Service } from './util/misc';
import compression from 'compression';


class AuthenticatedDataSource extends RemoteGraphQLDataSource {
    willSendRequest({ request, context }: any) {
        // pass the user from the context to downstream services as a header called "user"
        if (context.user !== undefined) {
            request.http.headers.set('user', JSON.stringify(context.user));
        }
    }
}

function createGateway(services: Service[]): ApolloServer {
    const graphqlUrls = services.map((s: any) => {
        return { name: s.name, url: appendUrl(s.url, "graphql")}
    });
    const gateway = new ApolloGateway({ 
        serviceList: graphqlUrls,
        buildService: ({ url }) => new AuthenticatedDataSource({ url })
    });
    
    const isPlaygroundActive = process.env.NODE_ENV !== "production";
    return new ApolloServer({
        gateway,
        subscriptions: false,
        context: ({ res }) => ({ user: res.locals.user }),
        playground: isPlaygroundActive
    });
}

type AddMiddleware = (app: Express) => void;
const createApp = (services: Service[], addMiddleware: AddMiddleware): Express => {
    const app = express();

    app.use(compression());

    const port = process.env.PORT || 3000;
    app.set("port", port);

    addMiddleware(app);

    const apolloServer = createGateway(services);
    apolloServer.applyMiddleware({ app, cors: true });

    configureRestProxies(app, services);

    // Health check
    app.get("/healthz", (req: Request, res: Response) => {
        res.send("ok");
    });

    return app;
}

export default createApp;
