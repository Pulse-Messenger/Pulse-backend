import "reflect-metadata";
import express from "express";
import { routerInstance } from "./app.router";
import { validationResult, matchedData } from "express-validator";
import { Validator } from "./validator";
import { RateLimitRequestHandler } from "express-rate-limit";

export type HTTPMethod = "get" | "post" | "delete";

const _api = "_api";
const _vapi = "_vapi";
const _wares = "_wares";

type Middleware = (
  req: express.Request,
  res: express.Response,
  next: (err: any) => void
) => any;

type MethodDecorator<T> = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => any;

const Validate = (
  rq: express.Request,
  rs: express.Response,
  next: express.NextFunction
) => {
  const errors = validationResult(rq);
  if (!errors.isEmpty()) {
    return rs.status(400).json({ errors: errors.array() });
  } else {
    next();
  }
};

export const Controller = (
  basePath: string,
  rateLimiter?: RateLimitRequestHandler
) => {
  return (constructor: Function) => {
    let path = basePath;
    const rt = express.Router();

    const controllerWares = Reflect.getMetadata(
      _wares,
      constructor.prototype
    ) as Middleware[];
    if (controllerWares) {
      controllerWares.forEach((ware) => rt.use(ware));
    }

    for (let key in constructor.prototype) {
      const api = Reflect.getMetadata(_api, constructor.prototype, key) as {
        type: HTTPMethod;
        path: string;
      };
      const vapi = Reflect.getMetadata(_vapi, constructor.prototype, key) as {
        type: HTTPMethod;
        path: string;
      };
      const wares = (Reflect.getMetadata(_wares, constructor.prototype, key) ??
        []) as Middleware[];

      if (api && vapi) throw "Api and vapi are defined on a single route 💢!";

      if (vapi)
        rt[vapi.type](vapi.path, ...wares, Validate, (req, res) => {
          try {
            return constructor.prototype[key](matchedData(req), req, res);
          } catch (error) {
            console.error({ error });
            res.sendStatus(503);
          }
        });

      if (api)
        rt[api.type](api.path, ...wares, (req, res) => {
          try {
            return constructor.prototype[key](req, res);
          } catch (error) {
            console.error({ error });
            res.sendStatus(503);
          }
        });
    }

    if (rateLimiter) routerInstance.use(path, rateLimiter);

    routerInstance.use(path, rt);
  };
};

export const Middleware = (middleware: Middleware): MethodDecorator<any> => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    let waresArray = Reflect.getMetadata(_wares, target, propertyKey) as
      | Middleware[]
      | undefined;
    if (!waresArray) waresArray = [];

    waresArray.push(middleware);
    Reflect.defineMetadata(_wares, waresArray, target, propertyKey);
  };
};

export const Api = (
  type: HTTPMethod = "get",
  path: string = "/"
): MethodDecorator<any> => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.enumerable = true;
    Reflect.defineMetadata(_api, { type, path }, target, propertyKey);
  };
};

type ValidatedRoute<T> = (
  data: T,
  rq: express.Request,
  rs: express.Response
) => any;

export const ValidatedApi = <MatchedT>(
  type: HTTPMethod,
  path: string,
  validator: Validator<MatchedT>
): MethodDecorator<ValidatedRoute<MatchedT>> => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (validator) {
      let waresArray = Reflect.getMetadata(_wares, target, propertyKey) as
        | Middleware[]
        | undefined;
      if (!waresArray) waresArray = [];

      validator.validator.forEach((validation: any) =>
        waresArray?.push(validation)
      );
      Reflect.defineMetadata(_wares, waresArray, target, propertyKey);
    }

    descriptor.enumerable = true;
    Reflect.defineMetadata(_vapi, { type, path }, target, propertyKey);
  };
};
