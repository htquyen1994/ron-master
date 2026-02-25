export type ResponseContext<T> = {
    data: T,
    code: number | string
    message: string
}