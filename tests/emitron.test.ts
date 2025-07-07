import emitron from '../src/index';

type MyEvents = {
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
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('foo', handler);
    emitter.emit('foo', 'hello');
    expect(handler).toHaveBeenCalledWith('hello', 'foo');
  });

  it('should not call handler after off', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('bar', handler);
    emitter.off('bar', handler);
    emitter.emit('bar', 42);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call all handlers for the same event', () => {
    const emitter = emitron<MyEvents>();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    emitter.on('baz', handler1);
    emitter.on('baz', handler2);
    emitter.emit('baz', { x: true });
    expect(handler1).toHaveBeenCalledWith({ x: true }, 'baz');
    expect(handler2).toHaveBeenCalledWith({ x: true }, 'baz');
  });

  it('should support wildcard handlers', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('*', handler);
    emitter.emit('foo', 'test');
    emitter.emit('bar', 123);
    expect(handler).toHaveBeenCalledWith('test', 'foo');
    expect(handler).toHaveBeenCalledWith(123, 'bar');
  });

  it('should remove all handlers for an event if no handler is passed to off', () => {
    const emitter = emitron<MyEvents>();
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
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('voidEvent', handler);
    emitter.emit('voidEvent', undefined);
    expect(handler).toHaveBeenCalledWith(undefined, 'voidEvent');
  });

  it('should unsubscribe on abort signal', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    const controller = new AbortController();
    emitter.on('foo', handler, { signal: controller.signal });
    controller.abort();
    emitter.emit('foo', 'should not be called');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should only call handler once when once option is true', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('foo', handler, { once: true });
    emitter.emit('foo', 'first');
    emitter.emit('foo', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('first', 'foo');
  });

  it('should only call wildcard handler once when once option is true', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    emitter.on('*', handler, { once: true });
    emitter.emit('bar', 123);
    emitter.emit('baz', { x: false });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(123, 'bar');
  });

  it('should return an unsubscribe function from on and remove the handler', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    const unsubscribe = emitter.on('foo', handler);
    emitter.emit('foo', 'first');
    expect(handler).toHaveBeenCalledWith('first', 'foo');
    unsubscribe();
    emitter.emit('foo', 'second');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return an unsubscribe function for wildcard handlers', () => {
    const emitter = emitron<MyEvents>();
    const handler = jest.fn();
    const unsubscribe = emitter.on('*', handler);
    emitter.emit('bar', 1);
    expect(handler).toHaveBeenCalledWith(1, 'bar');
    unsubscribe();
    emitter.emit('foo', 'test');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
