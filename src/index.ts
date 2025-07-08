export type GenericEventName = string | symbol;
export type GenericEvents = Record<GenericEventName, unknown>;

export type HandlerPayload<Events, Key extends keyof Events = keyof Events> = {
  [K in keyof Events]: { eventName: K; eventData: Events[K] };
}[Key];

type GenericHandler<Events, T extends keyof Events> = (payload: HandlerPayload<Events, T>) => void;

export type Handler<E, K extends keyof E = keyof E> = (payload: HandlerPayload<E, K>) => void;

export type GenericStore<Events extends GenericEvents> = Map<
  keyof Events,
  GenericHandler<Events, keyof Events>[]
>;

export type SubscribeParams = {
  signal?: AbortSignal;
  once?: boolean;
};

type KeysExactlyUndefined<T> = {
  [K in keyof T]: [T[K]] extends [undefined] ? K : never;
}[keyof T];
type KeysOptional<T> = {
  [K in keyof T]: [undefined] extends [T[K]] ? ([T[K]] extends [undefined] ? never : K) : never;
}[keyof T];
type KeysRequired<T> = {
  [K in keyof T]: [undefined] extends [T[K]] ? never : K;
}[keyof T];

interface Emit<Events extends GenericEvents> {
  <K extends KeysRequired<Events>>(eventName: K, eventData: Events[K]): void;
  <K extends KeysOptional<Events>>(eventName: K, eventData?: Events[K]): void;
  <K extends KeysExactlyUndefined<Events>>(eventName: K, eventData?: undefined): void;
}

export interface Emitron<Events extends GenericEvents> {
  on: <K extends keyof Events>(
    eventName: K | '*',
    handler: GenericHandler<Events, K>,
    params?: SubscribeParams,
  ) => () => void;
  off: <K extends keyof Events>(eventName: K | '*', handler?: GenericHandler<Events, K>) => void;
  emit: Emit<Events>;
}

const emitron = <Events extends GenericEvents>() => {
  const store: GenericStore<Events> = new Map();

  type MyHandler = GenericHandler<Events, keyof Events>;

  const instance: Emitron<Events> = {
    on: <K extends keyof Events>(
      eventName: K | '*',
      handler: GenericHandler<Events, K>,
      params?: SubscribeParams,
    ) => {
      if (params?.signal?.aborted) {
        return () => instance.off(eventName, handler);
      }

      let actualHandler: MyHandler = handler as MyHandler;
      if (params?.once) {
        actualHandler = (payload) => {
          instance.off(eventName === '*' ? '*' : payload.eventName, actualHandler);
          (handler as MyHandler)(payload);
        };
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
    emit: (eventName: keyof Events, eventData?: unknown) => {
      const handlers = store.get(eventName);
      if (handlers) {
        const snapshot = handlers.slice();
        for (let i = 0, len = snapshot.length; i < len; i++) {
          snapshot[i]({ eventData, eventName } as HandlerPayload<Events, keyof Events>);
        }
      }

      const wildcardHandlers = store.get('*');
      if (!wildcardHandlers) {
        return;
      }

      const wildcardSnapshot = wildcardHandlers.slice();
      for (let i = 0, len = wildcardSnapshot.length; i < len; i++) {
        wildcardSnapshot[i]({ eventData, eventName } as HandlerPayload<Events, keyof Events>);
      }
    },
  };

  return instance;
};

export default emitron;
