import { BaseDAO } from "../fetcher/fetcher";
import { ConstructorType } from '../models'

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
