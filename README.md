# Emitron

A tiny, type-safe event emitter for TypeScript projects. Supports wildcard events, one-time listeners, abortable subscriptions, and returns an unsubscribe function from `.on()`.

## Installation

Install via npm:

```sh
npm install emitron
```

Or, if using yarn:

```sh
yarn add emitron
```

## Usage

### Importing

#### ES Module (ESM)

```typescript
import emitron from 'emitron';
```

#### CommonJS

```js
const emitron = require('emitron');
```

### Defining Events

Define your event types as a TypeScript interface (must include an index signature):

```typescript
interface MyEvents {
  foo: string;
  bar: number;
}
```

### Typing Event Handlers (TypeScript)

You can type your event handlers for full type safety:

```typescript
import type { Handler } from 'emitron';

interface MyEvents {
  foo: string;
  bar: number;
}

const handler: Handler<MyEvents, 'foo'> = (payload) => {
  // payload.eventData is string, payload.eventName is 'foo'
  console.log(payload.eventData.toUpperCase());
};

const fooBarHandler: Handler<MyEvents, 'foo' | 'bar'> = (payload) => {
  if (payload.eventName === 'foo') {
    // payload.eventData is string
    console.log('foo:', payload.eventData.toUpperCase());
  } else if (payload.eventName === 'bar') {
    // payload.eventData is number
    console.log('bar:', payload.eventData + 1);
  }
};

const wildcardHandler: Handler<MyEvents> = (payload) => {
  // payload.eventName is keyof MyEvents, payload.eventData is MyEvents[keyof MyEvents]
  switch (payload.eventName) {
    case 'foo':
      // payload.eventData is string
      console.log('foo:', payload.eventData.toUpperCase());
      break;
    case 'bar':
      // payload.eventData is number
      console.log('bar:', payload.eventData + 1);
      break;
  }
};
```

### Creating an Instance

```typescript
const emitter = emitron<MyEvents>();
```

### Subscribing to Events

```typescript
// Returns an unsubscribe function
const unsubscribe = emitter.on('foo', (payload) => {
  // payload.eventData is string, payload.eventName is 'foo'
  console.log(`foo event:`, payload.eventData);
});

// Later, to remove the handler:
unsubscribe();

// Wildcard listener (receives all events)
const unsubAll = emitter.on('*', (payload) => {
  // payload.eventData is MyEvents[keyof MyEvents], payload.eventName is keyof MyEvents
  switch (payload.eventName) {
    case 'foo':
      // payload.eventData is string
      console.log('foo:', payload.eventData.toUpperCase());
      break;
    case 'bar':
      // payload.eventData is number
      console.log('bar:', payload.eventData + 1);
      break;
  }
});
```

#### One-time Listener

```typescript
emitter.on(
  'bar',
  (payload) => {
    // payload.eventData is number, payload.eventName is 'bar'
    console.log('bar event (once):', payload.eventData);
  },
  { once: true },
);
```

#### Abortable Listener

```typescript
const controller = new AbortController();
emitter.on(
  'foo',
  (payload) => {
    // payload.eventData is string, payload.eventName is 'foo'
    console.log('foo event (abortable):', payload.eventData);
  },
  { signal: controller.signal },
);
// Later, to remove the listener:
controller.abort();
```

### Subscribing to Multiple Events

Use `onMany` to subscribe to multiple events with a single handler:

```typescript
// Subscribe to multiple specific events
const unsubscribe = emitter.onMany(['foo', 'bar'], (payload) => {
  if (payload.eventName === 'foo') {
    // payload.eventData is string
    console.log('foo:', payload.eventData.toUpperCase());
  } else if (payload.eventName === 'bar') {
    // payload.eventData is number
    console.log('bar:', payload.eventData + 1);
  }
});

// Later, to remove the handler from all subscribed events:
unsubscribe();
```

#### One-time Listener for Multiple Events

**Note:** When using `{ once: true }` with `onMany`, the handler will trigger only once in total across all the specified events, not once per event.

```typescript
emitter.onMany(
  ['foo', 'bar'],
  (payload) => {
    console.log(`${payload.eventName} event (once):`, payload.eventData);
    // This handler will only execute once, regardless of which event ('foo' or 'bar') is emitted first
  },
  { once: true },
);
```

#### Abortable Listener for Multiple Events

```typescript
const controller = new AbortController();
emitter.onMany(
  ['foo', 'bar'],
  (payload) => {
    console.log(`${payload.eventName} event (abortable):`, payload.eventData);
  },
  { signal: controller.signal },
);
// Later, to remove the listener from all events:
controller.abort();
```

### Emitting Events

```typescript
emitter.emit('foo', 'hello world');
emitter.emit('bar', 42);
```

### Removing Listeners

```typescript
// Remove a specific handler
emitter.off('foo', handler);

// Remove all handlers for an event
emitter.off('foo');
```

## API

- `on(eventName, handler, params?)`: Subscribe to an event. Returns an unsubscribe function. Supports wildcard (`'*'`), one-time, and abortable listeners.
- `onMany(eventNames, handler, params?)`: Subscribe to multiple events with a single handler. Returns an unsubscribe function that removes the handler from all subscribed events.
- `off(eventName, handler?)`: Unsubscribe a handler or all handlers for an event.
- `emit(eventName, data?)`: Emit an event with data.

---

[MIT License](LICENSE)
