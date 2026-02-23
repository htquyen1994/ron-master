export type SubscribeFn = <T>(data: T) => void;

export class Subscribable<SubscribeFn> {
    public listeners = new Set<SubscribeFn>();

    constructor() {
    }

    subscribe(fn: SubscribeFn) {
        this.listeners.add(fn);
        this.onSubscribe();
        return () => {
            this.listeners.delete(fn);
            this.onUnsubscribe()
        }
    }

    protected onSubscribe() {};
    protected onUnsubscribe() {};

    hasListener() {
        return this.listeners.size > 0
    }

    unsubscribe() {

    }
}