export enum RequestMethod {

}

export type RequestContext<T> = {
    body: T,
    method: RequestMethod
}