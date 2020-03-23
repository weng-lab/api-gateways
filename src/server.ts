import createApp from "./app";
import { authMiddleware } from "./util/auth";
import { Service } from "./util/misc";

const services: Service[] = [];
for (let env in process.env) {
    if (env.startsWith("SERVICE_")) {
        const envVal = process.env[env];
        const splitEnvVal = envVal?.split(">");
        if (splitEnvVal === undefined || splitEnvVal.length !== 2) continue;
        services.push({ name: splitEnvVal[0], url: splitEnvVal[1] });
    }
}

// Bootstrap App with services and Firebase Auth Middleware
const app = createApp(services, (app) => {
    app.use(authMiddleware);
});

// start listening on the port
const port = app.get("port");
const server = app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}/graphql`);
});

export default server;
