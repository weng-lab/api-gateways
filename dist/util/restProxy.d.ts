import { Express } from "express";
import { Service } from "./misc";
export declare function configureRestProxies(app: Express, urls: Service[]): Promise<void>;
