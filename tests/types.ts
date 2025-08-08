import emitron, { Handler } from '../src';

type Events = {
  foo: string;
  bar: number;
  baz: boolean;
  optional?: number;
  obj: {
    name: string;
    age: number;
  };
  noData: undefined;
};

const emitter = emitron<Events>();

const foo: Handler<Events, 'foo'> = (_payload) => {};
const bar: Handler<Events, 'bar'> = (_payload) => {};
const baz: Handler<Events, 'baz'> = (_payload) => {};
const optional: Handler<Events, 'optional'> = (_payload) => {};
const obj: Handler<Events, 'obj'> = (_payload) => {};
const noData: Handler<Events, 'noData'> = (_payload) => {};
const wildcard: Handler<Events> = (_payload) => {};
const fooBarBaz: Handler<Events, 'foo' | 'bar' | 'baz'> = (_payload) => {};

// =========================
// on()
// =========================
{
  // Valid usages
  emitter.on('foo', foo);
  emitter.on('bar', bar);
  emitter.on('baz', baz);
  emitter.on('optional', optional);
  emitter.on('obj', obj);
  emitter.on('noData', noData);
  emitter.on('*', wildcard);
  emitter.on('foo', fooBarBaz);
  emitter.on('bar', fooBarBaz);
  emitter.on('baz', fooBarBaz);

  // Invalid usages
  // @ts-expect-error - event does not exist
  emitter.on('notAnEvent', foo);
  // @ts-expect-error - handler type mismatch
  emitter.on('foo', bar);
  // @ts-expect-error - handler type mismatch
  emitter.on('bar', baz);
  // @ts-expect-error - handler type mismatch
  emitter.on('obj', foo);
}

// =========================
// onMany()
// =========================
{
  // Valid usages
  emitter.onMany(['foo', 'bar', 'baz'], fooBarBaz);
  emitter.onMany(['foo'], foo);
  emitter.onMany(['bar'], bar);
  emitter.onMany(['foo', 'bar'], fooBarBaz);
  emitter.onMany(['bar', 'baz'], fooBarBaz);
  emitter.onMany(['foo', 'bar', 'baz'], wildcard);
  emitter.onMany(['optional'], optional);
  emitter.onMany(['obj'], obj);
  emitter.onMany(['noData'], noData);

  // Invalid usages
  // @ts-expect-error - event does not exist
  emitter.onMany(['foo', 'bar'], foo);
  // @ts-expect-error - event does not exist
  emitter.onMany(['notAnEvent'], foo);
  // @ts-expect-error - event does not exist
  emitter.onMany(['foo', 'notAnEvent'], fooBarBaz);
  // @ts-expect-error - handler type mismatch (foo handler can't handle bar events)
  emitter.onMany(['foo', 'bar'], foo);
  // @ts-expect-error - handler type mismatch (bar handler can't handle foo events)
  emitter.onMany(['foo', 'bar'], bar);
  // @ts-expect-error - handler type mismatch (obj handler can't handle string events)
  emitter.onMany(['foo'], obj);
  // @ts-expect-error - incompatible event types (foo is string, obj is object)
  emitter.onMany(['foo', 'obj'], fooBarBaz);
  // @ts-expect-error - empty array not allowed
  emitter.onMany([], foo);
}

// =========================
// off()
// =========================
{
  // Valid usages
  emitter.off('foo', foo);
  emitter.off('bar', bar);
  emitter.off('baz', baz);
  emitter.off('optional', optional);
  emitter.off('obj', obj);
  emitter.off('noData', noData);
  emitter.off('*', wildcard);
  emitter.off('foo', fooBarBaz);
  emitter.off('bar', fooBarBaz);
  emitter.off('baz', fooBarBaz);

  // Invalid usages
  // @ts-expect-error - event does not exist
  emitter.off('notAnEvent', foo);
  // @ts-expect-error - handler type mismatch
  emitter.off('foo', bar);
  // @ts-expect-error - handler type mismatch
  emitter.off('bar', baz);
  // @ts-expect-error - handler type mismatch
  emitter.off('obj', foo);
}

// =========================
// emit()
// =========================
{
  // Valid usages
  emitter.emit('foo', 'hello');
  emitter.emit('bar', 123);
  emitter.emit('baz', true);
  emitter.emit('optional', 42);
  emitter.emit('optional', undefined);
  emitter.emit('optional');
  emitter.emit('obj', { name: 'Alice', age: 30 });
  emitter.emit('noData', undefined);
  emitter.emit('noData');

  // Invalid usages
  // @ts-expect-error - event does not exist
  emitter.emit('notAnEvent', 'foo');
  // @ts-expect-error - payload type mismatch
  emitter.emit('foo', 123);
  // @ts-expect-error - payload type mismatch
  emitter.emit('bar', 'hello');
  // @ts-expect-error - payload type mismatch
  emitter.emit('obj', 'not an object');
  // @ts-expect-error - missing payload for required event
  emitter.emit('foo');
  // @ts-expect-error - extra payload for noData
  emitter.emit('noData', 123);
}
