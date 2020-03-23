"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
function onProxyReq(proxyReq, req, res) {
    if (res.locals.user !== undefined) {
        proxyReq.setHeader('user', JSON.stringify(res.locals.user));
    }
}
function configureRestProxies(app, urls) {
    return __awaiter(this, void 0, void 0, function* () {
        const endPointPromises = urls.map((url) => fetchServiceEndPoints(url));
        const allServiceEndPoints = yield Promise.all(endPointPromises);
        for (let serviceEndPoints of allServiceEndPoints) {
            if (serviceEndPoints.restEndPoints.length === 0)
                continue;
            const options = {
                target: serviceEndPoints.service.url,
                changeOrigin: true,
                onProxyReq
            };
            const proxy = http_proxy_middleware_1.createProxyMiddleware(serviceEndPoints.restEndPoints, options);
            app.use(proxy);
        }
    });
}
exports.configureRestProxies = configureRestProxies;
function fetchServiceEndPoints(service) {
    return __awaiter(this, void 0, void 0, function* () {
        let restEndPoints = [];
        try {
            const res = yield axios_1.default.get("/rest", { baseURL: service.url });
            restEndPoints = res.data;
        }
        catch (e) {
            if (e.response.status !== 404) {
                console.log(`/rest call to downstream service ${service.name} (${service.url}) failed`);
                throw e;
            }
        }
        return { service, restEndPoints };
    });
}
//# sourceMappingURL=restProxy.js.map