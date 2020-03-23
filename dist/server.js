"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const auth_1 = require("./util/auth");
const services = [];
for (let env in process.env) {
    if (env.startsWith("SERVICE_")) {
        const envVal = process.env[env];
        const splitEnvVal = (_a = envVal) === null || _a === void 0 ? void 0 : _a.split(">");
        if (splitEnvVal === undefined || splitEnvVal.length !== 2)
            continue;
        services.push({ name: splitEnvVal[0], url: splitEnvVal[1] });
    }
}
const app = app_1.default(services, (app) => {
    app.use(auth_1.authMiddleware);
});
const port = app.get("port");
const server = app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}/graphql`);
});
exports.default = server;
//# sourceMappingURL=server.js.map