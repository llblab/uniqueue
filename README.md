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

## Usage

### Basic Example (Max Heap)

```javascript
import { UniQueue } from "@llblab/uniqueue";

// Create a max-heap for leaderboard scores
const leaderboard = new UniQueue({
  compare: (a, b) => b.score - a.score, // Sort by score descending
  extractKey: (item) => item.playerId, // Unique by playerId
  maxSize: 3, // Keep only top 3 scores
});

// Add items
leaderboard.push({ playerId: "alice", score: 100 });
leaderboard.push({ playerId: "bob", score: 80 });
leaderboard.push({ playerId: "charlie", score: 120 });

console.log(leaderboard.peek());
// Output: { playerId: "charlie", score: 120 }

// Update existing item (alice improves score)
leaderboard.push({ playerId: "alice", score: 150 });
// Now alice is top, bob is pushed down

// Add item that exceeds maxSize
leaderboard.push({ playerId: "dave", score: 200 });
// Dave enters, Bob (lowest score) is evicted

console.log(leaderboard.data);
// Contains dave (200), alice (150), charlie (120)

// Iterate over all items
for (const player of leaderboard) {
  console.log(player.playerId, player.score);
}
```

## API

### `new UniQueue(options)`

Creates a new priority queue instance.

#### Options

| Option       | Type               | Default                                  | Description                                                            |
| :----------- | :----------------- | :--------------------------------------- | :--------------------------------------------------------------------- |
| `data`       | `T[]`              | `[]`                                     | Initial data array.                                                    |
| `maxSize`    | `number`           | `Infinity`                               | Maximum number of items. If exceeded, lowest priority item is evicted. |
| `compare`    | `(a, b) => number` | `(a, b) => (a < b ? -1 : a > b ? 1 : 0)` | Comparison function for heap ordering.                                 |
| `extractKey` | `(item) => string` | `(item) => item`                         | Function to extract unique key string from item.                       |

### Instance Methods

#### `push(item: T): T | undefined`

Adds an item to the queue or updates an existing item with the same key.

- If the key is new: Adds item. If size > maxSize, removes and returns the evicted item.
- If the key exists: Updates the existing item and rebalances. Returns `undefined`.

#### `pop(): T | undefined`

Removes and returns the highest priority item (the root of the heap).

#### `peek(): T | undefined`

Returns the highest priority item without removing it.

#### `remove(key: string): boolean`

Removes the item with the given key. Returns `true` if removed, `false` otherwise.

#### `has(key: string): boolean`

Checks if an item with the given key exists.

#### `get(key: string): T | undefined`

Returns the item with the given key without removing it.

#### `clear(): void`

Removes all items from the queue.

#### `size: number`

Getter property that returns the number of items.

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
