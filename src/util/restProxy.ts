import axios from "axios";
import { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Service } from "./misc";
import * as http from 'http';

interface ServiceRestEndPoints {
    service: Service,
    restEndPoints: string[]
}

function onProxyReq(proxyReq: http.ClientRequest, req: Request, res: Response) {
    // add custom header to request
    if (res.locals.user !== undefined) {
        proxyReq.setHeader('user', JSON.stringify(res.locals.user));
    }
}

export async function configureRestProxies(app: Express, urls: Service[]) {
    const endPointPromises: Promise<ServiceRestEndPoints>[] = urls.map((url) => fetchServiceEndPoints(url));
    const allServiceEndPoints: ServiceRestEndPoints[] = await Promise.all(endPointPromises);
    for (let serviceEndPoints of allServiceEndPoints) {
        if (serviceEndPoints.restEndPoints.length === 0) continue;
        const options = {
            target: serviceEndPoints.service.url, 
            changeOrigin: true,
            onProxyReq
        };
        const proxy = createProxyMiddleware(serviceEndPoints.restEndPoints, options);
        app.use(proxy);
    }
}

async function fetchServiceEndPoints(service: Service): Promise<ServiceRestEndPoints> {
    let restEndPoints: string[] = [];
    let endPoints: string[] = [];
    try {
        const res = await axios.get<string[]>("/rest", { baseURL: service.url });
        restEndPoints = res.data;
        endPoints = restEndPoints.map((rs)=>{
            let l = rs.split("/")
            l.forEach(s=>{
                if(s.startsWith(":"))
                {
                    let idx = l.findIndex(a=>a===s)
                    if(idx!=-1)
                    {
                        l.splice(idx, 1, "*")   
                    }
                }
            })            
           
            return l.join("/")
        })

    } catch(e) {
        if (e.response.status !== 404) {
            console.log(`/rest call to downstream service ${service.name} (${service.url}) failed`);
            throw e;
        }
    }
    return { service, restEndPoints: endPoints };
}