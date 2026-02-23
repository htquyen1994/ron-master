import {Subscribable} from "../core";

type OnlineListenerFn = (status: boolean) => void;
type SetupOnlineFn = (onlineFn: OnlineListenerFn) => void;

export class OnlineManager extends Subscribable {
    _setup: SetupOnlineFn;
    _online: boolean = navigator.onLine || false;
    _cleanup?: () => void;

    constructor() {
        super();
        if (this._isBrowser()) {
            this._setup = (onlineFn: OnlineListenerFn) => {
                const online = () => onlineFn(true);
                const offline = () => onlineFn(false)
                window.addEventListener("online", online);
                window.addEventListener("offline", offline);
                return () => {
                    window.removeEventListener("online", online);
                    window.removeEventListener("offline", offline);
                }
            }
        }
    }

    protected onSubscribe() {
        if (this.hasListener()) {
            this._cleanup = this._setup(this.onlineChangedListener.bind(this))
        }
    }

    protected onUnsubscribe() {
        if (!this.hasListener()) {
            this._cleanup?.();
            this._cleanup = undefined;
        }
    }

    private onlineChangedListener(status: boolean) {
        if (status !== this._online) {
            this.listeners.forEach(fn => fn(status))
        }
    }

    _isBrowser() {
        return typeof window !== "undefined"
    }
}