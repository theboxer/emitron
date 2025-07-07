export type GenericEventType = string | symbol;
export type GenericEvents = Record<GenericEventType, unknown>;

export type GenericHandler<Events extends GenericEvents, T extends keyof Events> = (
  data: Events[T],
  type: T,
) => void;

export type GenericStore<Events extends GenericEvents> = Map<
  keyof Events,
  GenericHandler<Events, keyof Events>[]
>;

export type SubscribeParams = {
  signal?: AbortSignal;
  once?: boolean;
};

export type Emitron<Events extends GenericEvents> = {
  on: <K extends keyof Events>(
    eventName: K | '*',
    handler: GenericHandler<Events, K>,
    params?: SubscribeParams,
  ) => () => void;
  off: <K extends keyof Events>(eventName: K | '*', handler?: GenericHandler<Events, K>) => void;
  emit: <K extends keyof Events>(eventName: K, data: Events[K]) => void;
};

const emitron = <Events extends GenericEvents>() => {
  const store: GenericStore<Events> = new Map();

  type MyHandler = GenericHandler<Events, keyof Events>;

  const instance: Emitron<Events> = {
    on: (eventName, handler, params) => {
      if (params?.signal?.aborted) {
        return () => instance.off(eventName, handler);
      }

      let actualHandler: MyHandler = handler as MyHandler;
      if (params?.once) {
        actualHandler = ((data: Events[keyof Events], type: keyof Events) => {
          instance.off(eventName, actualHandler);
          (handler as MyHandler)(data, type);
        }) as MyHandler;
      }

      const handlers = store.get(eventName);
      if (!handlers) {
        store.set(eventName, [actualHandler]);
      } else {
        handlers.push(actualHandler);
      }

      params?.signal?.addEventListener('abort', () => {
        instance.off(eventName, actualHandler);
      });

      return () => instance.off(eventName, actualHandler);
    },
    off: (eventName, handler) => {
      const handlers = store.get(eventName);
      if (!handlers) {
        return;
      }

      if (!handler) {
        store.set(eventName, []);
        return;
      }

      const handlerIndex = handlers.indexOf(handler as MyHandler);
      if (handlerIndex === -1) {
        return;
      }

      handlers.splice(handlerIndex, 1);
    },
    emit: (eventName, data) => {
      const handlers = store.get(eventName);
      if (handlers) {
        const snapshot = handlers.slice();
        for (let i = 0, len = snapshot.length; i < len; i++) {
          snapshot[i](data, eventName);
        }
      }

      const wildcardHandlers = store.get('*');
      if (!wildcardHandlers) {
        return;
      }

      const wildcardSnapshot = wildcardHandlers.slice();
      for (let i = 0, len = wildcardSnapshot.length; i < len; i++) {
        wildcardSnapshot[i](data, eventName);
      }
    },
  };

  return instance;
};

export default emitron;
