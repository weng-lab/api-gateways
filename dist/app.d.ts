import 'graphql-import-node';
import express, { Express } from "express";
import { Service } from './util/misc';
declare type AddMiddleware = (app: Express) => void;
declare const createApp: (services: Service[], addMiddleware: AddMiddleware) => express.Express;
export default createApp;
