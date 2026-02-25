import {WeakMapExtender} from '../base'
export type RequestContext = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
}

export type ResponseContext<T=unknown> = {
    data: T;
    status: number;
    config: RequestContext;
}

export interface ApiMiddleware {
    onRequest: (request: RequestContext) => Promise<RequestContext> | RequestContext;
    onResponse: (response: ResponseContext) => Promise<ResponseContext> | ResponseContext;
}

export abstract class ApiBaseClient {
    abstract get<T>(url: string, optional?: RequestContext): Promise<T>;
    // abstract post<T>(url: string, payload: object, optional?: RequestContext): Promise<T>;
    // abstract put<T>(url: string, payload: object, optional?: RequestContext): Promise<T>;
    // abstract delete<T>(url: string, optional?: RequestContext): Promise<T>;
    // abstract patch<T>(url: string, payload: object, optional?: RequestContext): Promise<T>;
    // abstract transformResponse<T>(response: Response): T;
    // abstract handlerErrorResponse(): Promise<void>
}

export type ConstructorType<T=unknown> = new (...args: any[]) => T;
export class FactoryApiClient {
    private static instances = new WeakMapExtender<ConstructorType, InstanceType<typeof ApiBaseClient>>();
    static use<T extends ApiBaseClient>(fetcher: ConstructorType<T>) {
        if (FactoryApiClient.instances.has(fetcher)) {
            return FactoryApiClient.instances.get(fetcher);
        }

        const instance = new fetcher();
        FactoryApiClient.instances.set(fetcher, instance);
        return instance
    }
}

export class ApiClient extends ApiBaseClient {

    protected middlewares: ApiMiddleware[] = [];

    public use(middleware: ApiMiddleware) {
        this.middlewares.push(middleware);
    }

    override get<T>(url: string, optional?: RequestContext): Promise<T> {
        return fetch(url).then(response => {
            console.log("===> Response test", response);
            return Promise.resolve(response as any)
        })
    }
    // override post<T>(url: string, payload: object, optional?: RequestContext): Promise<T> {
    //     throw new Error("Method not implemented.");
    // }
    // override put<T>(url: string, payload: object, optional?: RequestContext): Promise<T> {
    //     throw new Error("Method not implemented.");
    // }
    // override delete<T>(url: string, optional?: RequestContext): Promise<T> {
    //     throw new Error("Method not implemented.");
    // }
    // override patch<T>(url: string, payload: object, optional?: RequestContext): Promise<T> {
    //     throw new Error("Method not implemented.");
    // }
    // override transformResponse<T>(response: Response): T {
    //     throw new Error("Method not implemented.");
    // }
    // override handlerErrorResponse(): Promise<void> {
    //     throw new Error("Method not implemented.");
    // }
}

// libs/core-api/src/dao/base.dao.ts

export abstract class BaseDao<T> {
//   constructor(
//     protected readonly api: ApiClient,
//     protected readonly endpoint: string
//   ) {}
    public fetcher = FactoryApiClient.use(ApiClient)
    // 1. Helper để build URL động (ví dụ: cho nested resources)
//   protected buildUrl(...parts: string[]): string {
//     return [this.endpoint, ...parts].filter(Boolean).join('/').replace(/\/+/g, '/');
//   }

//   // 2. Các phương thức chuẩn
//   public async getList(query?: object): Promise<T[]> {
//     return this.api.get<T[]>(this.buildUrl(), query);
//   }

//   public async getById(id: string | number): Promise<T> {
//     return this.api.get<T>(this.buildUrl(id.toString()));
//   }

//   public async insert(payload: any): Promise<T> {
//     return this.api.post<T>(this.buildUrl(), payload);
//   }

//   public async update(id: string | number, payload: any): Promise<T> {
//     return this.api.put<T>(this.buildUrl(id.toString()), payload);
//   }

//   public async delete(id: string | number): Promise<void> {
//     return this.api.delete(this.buildUrl(id.toString()));
//   }

//   // 3. Khả năng mở rộng cho các action tùy chỉnh (Custom Actions)
//   protected async patchAction<R>(id: string | number, action: string, data?: any): Promise<R> {
//     return this.api.put<R>(this.buildUrl(id.toString(), action), data);
//   }
}

export abstract class BaseDAO {
    public fetcher = FactoryApiClient.use(ApiClient)
}
export class DAOFactory {
    static instances = new WeakMapExtender<ConstructorType<BaseDAO>, InstanceType<typeof BaseDAO>>
    static use<T extends BaseDAO>(constructor: ConstructorType<T>): T {
        if (DAOFactory.instances.has(constructor)) {
            return DAOFactory.instances.get(constructor) as T;
        }

        const instance = new constructor();
        DAOFactory.instances.set(constructor, instance);
        return instance
    }
}

export abstract class BaseDAO {
    public fetcher = FactoryApiClient.use(ApiClient);

    constructor() {
        this.initDecoratedMethods();
    }

    private initDecoratedMethods() {
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype).filter(name => name !== 'constructor');

        for (const name of methodNames) {
            const path = Reflect.getMetadata(METADATA_KEYS.PATH, prototype, name);
            const method = Reflect.getMetadata(METADATA_KEYS.METHOD, prototype, name);

            if (path && method) {
                // Ghi đè hàm rỗng bằng logic gọi API thật
                const originalMethod = this[name];
                this[name] = async (...args: any[]) => {
                    const params = Reflect.getMetadata(METADATA_KEYS.PARAMS, prototype, name) || [];
                    const transform = Reflect.getMetadata(METADATA_KEYS.TRANSFORM, prototype, name);

                    let finalUrl = path;
                    let body = null;

                    // Map tham số truyền vào với Decorators
                    params.forEach((p: any) => {
                        if (p.type === 'PATH') {
                            finalUrl = finalUrl.replace(`{${p.name}}`, args[p.index]);
                        }
                        if (p.type === 'BODY') {
                            body = args[p.index];
                        }
                    });

                    // Xử lý Transform Payload
                    if (transform?.payloadToRequest) {
                        body = transform.payloadToRequest(body);
                    }

                    // Thực thi gọi API
                    let response = await this.fetcher.request({
                        url: finalUrl,
                        method: method,
                        headers: {},
                        body: body
                    });

                    // Xử lý Transform Response
                    if (transform?.responseToModel) {
                        response = transform.responseToModel(response);
                    }

                    return response;
                };
            }
        }
    }
}

export class UserDAO extends BaseDAO {
    @Patch('/console/v1/users/{userId}') // Path động
    @Method('POST')
    @Transform({
        payloadToRequest: (p) => ({ ...p, timestamp: Date.now() }), // Ví dụ transform
        responseToModel: (res) => new User(res)
    })
    updatedUser(
        @ReqPathParam('userId') userId: string,
        @ReqPayload() payload: any
    ) {
        // Thân hàm rỗng, tất cả đã được Decorator xử lý
        return null as any;
    }
}

// Bên ngoài gọi
const userDAO = DAOFactory.use(UserDAO);
await userDAO.updatedUser('123', { name: 'Gemini' });