import {ApiClient, FactoryApiClient} from "../fetcher/fetcher";

export abstract class BaseDao<T> {

    public fetcher = FactoryApiClient.use(ApiClient)
}