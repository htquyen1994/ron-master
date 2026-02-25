export const useGlobalStore = ((window: any) => {
    const KEY_GLOBAL = Symbol.for('__ron__');
    const getStateGlobal = () => {
        const state = new Map();
        return function() {
            const [mode, key, value] = arguments;
            if (mode == 'get') {
                return state.get(key);
            } else {
                state.set(key, value);
                return state.has(key)
            }
        }
    }

    const globalScope = window[KEY_GLOBAL] ?? new Proxy(getStateGlobal(), {
        get(target: any, p: string) {
            return target('get', p);
        },
        set(target: any, p: string, newValue: any) {
            return target('set', p, newValue)
        },
    })

    window[KEY_GLOBAL] = globalScope;
    return <T>(key: string, initFn: () => T) => {
        if (!globalScope[key]) {
            globalScope[key] = initFn()
        }
        return globalScope[key] as T
    }
})(typeof window === 'undefined' ? {} : window)