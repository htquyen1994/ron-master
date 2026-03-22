export enum RequestMethod {
    POST='POST',
    PUT='PUT',
    DELETE='DELETE',
    GET='GET'
}

export type RequestContext<T> = {
    body: T,
    method: RequestMethod,
    headers: Record<string, string>
}