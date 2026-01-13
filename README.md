# Uniqueue

A high-performance **priority queue with unique key constraint**.

Combines a binary heap with a key-to-index `Map`, enabling O(log n) inserts/updates and O(1) lookups. Designed for leaderboard deduplication, task scheduling with updates, and LRU-like eviction scenarios.

## Features

- **Unique Constraint**: Ensures only one item per key exists in the queue.
- **In-Place Updates**: If an item with the same key is pushed, it updates the existing entry in-place (bubbling up or down as needed).
- **O(1) Lookup**: Tracks item positions internally, avoiding O(n) scans for updates.
- **Max Size Eviction**: Automatically removes the lowest-priority item when the limit is reached.
- **Iterable**: Supports `for...of` iteration over items.
- **Zero Dependencies**: ~1.7KB minified, ~0.7KB gzipped.

## Installation

```bash
npm install @llblab/uniqueue
```

```bash
deno add jsr:@llblab/uniqueue
```

## Usage

### Basic Example (Top-N Leaderboard)

```javascript
import { Uniqueue } from "@llblab/uniqueue";

// The `compare` function determines which item sits at the root:
// - (a, b) => a - b → Min-heap (smallest at root, evicted first)
// - (a, b) => b - a → Max-heap (largest at root, evicted first)
//
// For "Top-N" scenario, use min-heap: when maxSize is exceeded,
// the root (smallest/worst) is evicted, keeping the best scores.
const leaderboard = new Uniqueue({
  compare: (a, b) => a.score - b.score,
  extractKey: (item) => item.playerId,
  maxSize: 3,
});

// Add items
leaderboard.push({ playerId: "alice", score: 100 });
leaderboard.push({ playerId: "bob", score: 80 });
leaderboard.push({ playerId: "charlie", score: 120 });

console.log(leaderboard.peek());
// Output: { playerId: "bob", score: 80 } (min-heap root)

// Update existing item (alice improves score)
leaderboard.push({ playerId: "alice", score: 150 });

// Add item that exceeds maxSize
leaderboard.push({ playerId: "dave", score: 200 });
// Bob (lowest score at root) is evicted

console.log(leaderboard.data);
// Contains charlie (120), alice (150), dave (200)

// Iterate over all items
for (const player of leaderboard) {
  console.log(player.playerId, player.score);
}
```

## API

### `new Uniqueue(options)`

Creates a new priority queue instance.

#### Options

| Option       | Type               | Default                                  | Description                                                            |
| :----------- | :----------------- | :--------------------------------------- | :--------------------------------------------------------------------- |
| `data`       | `T[]`              | `[]`                                     | Initial data array.                                                    |
| `maxSize`    | `number`           | `Infinity`                               | Maximum number of items. If exceeded, lowest priority item is evicted. |
| `compare`    | `(a, b) => number` | `(a, b) => (a < b ? -1 : a > b ? 1 : 0)` | Comparison function for heap ordering.                                 |
| `extractKey` | `(item) => K`      | `(item) => item`                         | Function to extract unique key any type from item.                     |

### Instance Methods

#### `push(item: T): T | undefined`

Adds an item to the queue or updates an existing item with the same key.

- If the key is new: Adds item. If size > maxSize, removes and returns the evicted item.
- If the key exists: Updates the existing item and rebalances. Returns `undefined`.

#### `pop(): T | undefined`

Removes and returns the highest priority item (the root of the heap).

#### `peek(): T | undefined`

Returns the highest priority item without removing it.

#### `remove(key: K): boolean`

Removes the item with the given key. Returns `true` if removed, `false` otherwise.

#### `has(key: K): boolean`

Checks if an item with the given key exists.

#### `get(key: K): T | undefined`

Returns the item with the given key without removing it.

#### `clear(): void`

Removes all items from the queue.

#### `size: number`

Getter property that returns the number of items.

#### `data: T[]`

The underlying heap array. Items are in heap order (not sorted).

#### `indexes: Map<K, number>`

Map from keys to their positions in the `data` array.

#### `[Symbol.iterator](): IterableIterator<T>`

Iterates over items in heap order (not sorted).

## Complexity

| Operation       | Time Complexity |
| :-------------- | :-------------- |
| `push` (insert) | O(log n)        |
| `push` (update) | O(log n)        |
| `pop`           | O(log n)        |
| `remove`        | O(log n)        |
| `peek` / `get`  | O(1)            |
| `has`           | O(1)            |

## License

MIT
