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
  onMany: <K extends keyof Events>(
    eventNames: [K, ...K[]],
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
    /**
     * Subscribes to an event or wildcard ('*') with a handler.
     * @param eventName The event name or '*'.
     * @param handler The handler function to call when the event is emitted.
     * @param params Optional subscription parameters (e.g., once, signal).
     * @returns A function to unsubscribe the handler.
     */
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

    /**
     * Subscribes to multiple events with a single handler.
     * @param eventNames Array of event names.
     * @param handler The handler function to call when any of the events is emitted.
     * @param params Optional subscription parameters (e.g., once, signal).
     * @returns A function to unsubscribe the handler from all events.
     */
    onMany: <K extends keyof Events>(
      eventNames: [K, ...K[]],
      handler: GenericHandler<Events, K>,
      params?: SubscribeParams,
    ) => {
      if (params?.once) {
        let hasBeenCalled = false;
        const onceHandler: GenericHandler<Events, K> = (payload) => {
          if (hasBeenCalled) return;
          hasBeenCalled = true;

          unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());

          handler(payload);
        };

        const unsubscribeFunctions = eventNames.map((eventName) =>
          instance.on(eventName, onceHandler, { signal: params.signal }),
        );

        return () => {
          unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
        };
      }

      const unsubscribeFunctions = eventNames.map((eventName) =>
        instance.on(eventName, handler, params),
      );

      return () => {
        unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
      };
    },

    /**
     * Unsubscribes a handler from an event or wildcard ('*').
     * @param eventName The event name or '*'.
     * @param handler The handler function to remove. If omitted, removes all handlers for the event.
     */
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

    /**
     * Emits an event, calling all handlers for the event and wildcard ('*').
     * @param eventName The event name to emit.
     * @param eventData The data to pass to handlers.
     */
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
