import emitron from '../src/index';

type Events = {
  foo: string;
  bar: number;
  baz: { x: boolean };
  voidEvent: void;
};

describe('emitron', () => {
  it('should be a function', () => {
    expect(typeof emitron).toBe('function');
  });

  it('should call handler when event is emitted', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('foo', handler);
    emitter.emit('foo', 'hello');
    expect(handler).toHaveBeenCalledWith({ eventData: 'hello', eventName: 'foo' });
  });

  it('should not call handler after off', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('bar', handler);
    emitter.off('bar', handler);
    emitter.emit('bar', 42);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call all handlers for the same event', () => {
    const emitter = emitron<Events>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    emitter.on('baz', handler1);
    emitter.on('baz', handler2);
    emitter.emit('baz', { x: true });
    expect(handler1).toHaveBeenCalledWith({ eventData: { x: true }, eventName: 'baz' });
    expect(handler2).toHaveBeenCalledWith({ eventData: { x: true }, eventName: 'baz' });
  });

  it('should support wildcard handlers', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('*', handler);
    emitter.emit('foo', 'test');
    emitter.emit('bar', 123);
    expect(handler).toHaveBeenCalledWith({ eventData: 'test', eventName: 'foo' });
    expect(handler).toHaveBeenCalledWith({ eventData: 123, eventName: 'bar' });
  });

  it('should remove all handlers for an event if no handler is passed to off', () => {
    const emitter = emitron<Events>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    emitter.on('foo', handler1);
    emitter.on('foo', handler2);
    emitter.off('foo');
    emitter.emit('foo', 'gone');
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should support void events', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('voidEvent', handler);
    emitter.emit('voidEvent', undefined);
    expect(handler).toHaveBeenCalledWith({ eventData: undefined, eventName: 'voidEvent' });
  });

  it('should unsubscribe on abort signal', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    const controller = new AbortController();
    emitter.on('foo', handler, { signal: controller.signal });
    controller.abort();
    emitter.emit('foo', 'should not be called');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should only call handler once when once option is true', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('foo', handler, { once: true });
    emitter.emit('foo', 'first');
    emitter.emit('foo', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ eventData: 'first', eventName: 'foo' });
  });

  it('should only call wildcard handler once when once option is true', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    emitter.on('*', handler, { once: true });
    emitter.emit('bar', 123);
    emitter.emit('baz', { x: false });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ eventData: 123, eventName: 'bar' });
  });

  it('should return an unsubscribe function from on and remove the handler', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    const unsubscribe = emitter.on('foo', handler);
    emitter.emit('foo', 'first');
    expect(handler).toHaveBeenCalledWith({ eventData: 'first', eventName: 'foo' });
    unsubscribe();
    emitter.emit('foo', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return an unsubscribe function for wildcard handlers', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    const unsubscribe = emitter.on('*', handler);
    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledWith({ eventData: 1, eventName: 'bar' });
    unsubscribe();
    emitter.emit('foo', 'test');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should register a handler for multiple events', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    emitter.onMany(['foo', 'bar'], handler);

    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledWith({ eventData: 1, eventName: 'bar' });
    emitter.emit('foo', 'test');
    expect(handler).toHaveBeenCalledWith({ eventData: 'test', eventName: 'foo' });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should return an unsubscribe function from onMany that removes handler from all events', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    const unsubscribe = emitter.onMany(['foo', 'bar'], handler);

    emitter.emit('foo', 'first');
    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledTimes(2);

    unsubscribe();

    emitter.emit('foo', 'second');
    emitter.emit('bar', 2);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should support once option with onMany', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    emitter.onMany(['foo', 'bar'], handler, { once: true });

    emitter.emit('foo', 'first');
    expect(handler).toHaveBeenCalledTimes(1);

    emitter.emit('bar', 1);
    emitter.emit('foo', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support abort signal with onMany', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();
    const controller = new AbortController();

    emitter.onMany(['foo', 'bar'], handler, { signal: controller.signal });

    emitter.emit('foo', 'before abort');
    expect(handler).toHaveBeenCalledTimes(1);

    controller.abort();

    emitter.emit('foo', 'after abort');
    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle onMany with single event', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    emitter.onMany(['baz'], handler);

    emitter.emit('baz', { x: true });
    expect(handler).toHaveBeenCalledWith({ eventData: { x: true }, eventName: 'baz' });
  });

  it('should handle onMany with all events', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    emitter.onMany(['foo', 'bar', 'baz', 'voidEvent'], handler);

    emitter.emit('foo', 'test');
    emitter.emit('bar', 42);
    emitter.emit('baz', { x: false });
    emitter.emit('voidEvent', undefined);

    expect(handler).toHaveBeenCalledTimes(4);
    expect(handler).toHaveBeenNthCalledWith(1, { eventData: 'test', eventName: 'foo' });
    expect(handler).toHaveBeenNthCalledWith(2, { eventData: 42, eventName: 'bar' });
    expect(handler).toHaveBeenNthCalledWith(3, { eventData: { x: false }, eventName: 'baz' });
    expect(handler).toHaveBeenNthCalledWith(4, { eventData: undefined, eventName: 'voidEvent' });
  });

  it('should allow multiple onMany registrations for same events', () => {
    const emitter = emitron<Events>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    emitter.onMany(['foo', 'bar'], handler1);
    emitter.onMany(['foo', 'bar'], handler2);

    emitter.emit('foo', 'test');

    expect(handler1).toHaveBeenCalledWith({ eventData: 'test', eventName: 'foo' });
    expect(handler2).toHaveBeenCalledWith({ eventData: 'test', eventName: 'foo' });
  });

  it('should work with off() to remove onMany handlers', () => {
    const emitter = emitron<Events>();
    const handler = jest.fn();

    emitter.onMany(['foo', 'bar'], handler);

    emitter.emit('foo', 'first');
    expect(handler).toHaveBeenCalledTimes(1);

    emitter.off('foo', handler);

    emitter.emit('foo', 'second');
    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledTimes(2); // only bar event should trigger
  });
});
