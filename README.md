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
  [key: string]: unknown; // Required for type compatibility
}
```

### Creating an Instance

```typescript
const emitter = emitron<MyEvents>();
```

### Subscribing to Events

```typescript
// Returns an unsubscribe function
const unsubscribe = emitter.on('foo', (data, type) => {
  console.log(`foo event:`, data);
});

// Later, to remove the handler:
unsubscribe();

// Wildcard listener (receives all events)
const unsubAll = emitter.on('*', (data, type) => {
  console.log(`Event ${String(type)}:`, data);
});
```

#### One-time Listener

```typescript
emitter.on(
  'bar',
  (data, type) => {
    console.log('bar event (once):', data);
  },
  { once: true },
);
```

#### Abortable Listener

```typescript
const controller = new AbortController();
emitter.on(
  'foo',
  (data, type) => {
    console.log('foo event (abortable):', data);
  },
  { signal: controller.signal },
);
// Later, to remove the listener:
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
- `off(eventName, handler?)`: Unsubscribe a handler or all handlers for an event.
- `emit(eventName, data)`: Emit an event with data.

---

MIT License
