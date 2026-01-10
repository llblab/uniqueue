/**
 * @template T
 * @typedef {Object} UniQueueOptions
 * @property {T[]} [data] - Initial data array
 * @property {number} [maxSize] - Maximum queue size (default: Infinity)
 * @property {(a: T, b: T) => number} [compare] - Comparison function for heap ordering
 * @property {(item: T) => string} [extractKey] - Function to extract unique key from item
 */

/**
 * Priority queue with unique key constraint.
 * Combines a min-heap with a key-to-index map for O(log n) push/pop with deduplication.
 *
 * @template T
 */
export class UniQueue {
  /** @type {T[]} */
  data;

  /** @type {Map<string, number>} */
  indexes;

  /** @type {number} */
  #maxSize;

  /** @type {(a: T, b: T) => number} */
  #compare;

  /** @type {(item: T) => string} */
  #extractKey;

  /**
   * @param {UniQueueOptions<T>} [options]
   */
  constructor({
    data = [],
    maxSize = Infinity,
    compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    extractKey = (item) =>
      /** @type {string} */ (/** @type {unknown} */ (item)),
  } = {}) {
    this.data = data;
    this.indexes = new Map(
      data.map((item, index) => [extractKey(item), index]),
    );
    this.#maxSize = maxSize;
    this.#compare = compare;
    this.#extractKey = extractKey;

    if (data.length > 0) {
      for (let i = (data.length >>> 1) - 1; i >= 0; i--) {
        this.#siftDown(i);
      }
    }
  }

  /**
   * Move item up the heap to maintain heap property.
   * @param {number} pos
   */
  #siftUp(pos) {
    const { data, indexes } = this;
    const compare = this.#compare;
    const extractKey = this.#extractKey;
    const item = data[pos];

    while (pos > 0) {
      const parentIndex = (pos - 1) >>> 1;
      const parent = data[parentIndex];
      if (compare(item, parent) >= 0) break;
      indexes.set(extractKey(parent), pos);
      data[pos] = parent;
      pos = parentIndex;
    }

    indexes.set(extractKey(item), pos);
    data[pos] = item;
  }

  /**
   * Move item down the heap to maintain heap property.
   * @param {number} pos
   */
  #siftDown(pos) {
    const { data, indexes } = this;
    const compare = this.#compare;
    const extractKey = this.#extractKey;
    const item = data[pos];
    const halfLength = data.length >>> 1;

    while (pos < halfLength) {
      let leftIndex = (pos << 1) + 1;
      let best = data[leftIndex];
      const rightIndex = leftIndex + 1;

      if (rightIndex < data.length) {
        const right = data[rightIndex];
        if (compare(right, best) < 0) {
          leftIndex = rightIndex;
          best = right;
        }
      }

      if (compare(best, item) >= 0) break;

      indexes.set(extractKey(best), pos);
      data[pos] = best;
      pos = leftIndex;
    }

    indexes.set(extractKey(item), pos);
    data[pos] = item;
  }

  /**
   * Add or update an item in the queue.
   * - If key exists: Updates item and rebalances (unconditional update).
   * - If key new: Adds item. If size > maxSize, evicts and returns min item.
   * @param {T} item
   * @returns {T | undefined} Evicted item if queue was full
   */
  push(item) {
    const key = this.#extractKey(item);
    const index = this.indexes.get(key);

    if (index === undefined) {
      this.data.push(item);
      this.#siftUp(this.data.length - 1);
      if (this.data.length <= this.#maxSize) return;
      return this.pop();
    }

    const oldItem = this.data[index];
    this.data[index] = item;
    const cmp = this.#compare(oldItem, item);

    if (cmp < 0) {
      this.#siftDown(index);
    } else if (cmp > 0) {
      this.#siftUp(index);
    }
  }

  /**
   * Remove and return the top (minimum) item.
   * @returns {T | undefined}
   */
  pop() {
    if (this.data.length === 0) return;

    const top = this.data[0];
    this.indexes.delete(this.#extractKey(top));

    const bottom = this.data.pop();
    if (this.data.length > 0 && bottom !== undefined) {
      this.indexes.set(this.#extractKey(bottom), 0);
      this.data[0] = bottom;
      this.#siftDown(0);
    }

    return top;
  }

  /**
   * Return the top (minimum) item without removing it.
   * @returns {T | undefined}
   */
  peek() {
    return this.data[0];
  }

  /**
   * Remove an item by key.
   * @param {string} key
   * @returns {boolean} true if item was removed
   */
  remove(key) {
    const index = this.indexes.get(key);
    if (index === undefined) return false;

    const lastIndex = this.data.length - 1;
    if (index === lastIndex) {
      this.indexes.delete(key);
      this.data.pop();
      return true;
    }

    const item = /** @type {T} */ (this.data.pop());
    this.indexes.delete(key);
    this.indexes.set(this.#extractKey(item), index);
    this.data[index] = item;

    const parentIndex = (index - 1) >>> 1;
    if (index > 0 && this.#compare(item, this.data[parentIndex]) < 0) {
      this.#siftUp(index);
    } else {
      this.#siftDown(index);
    }

    return true;
  }

  /**
   * Check if an item exists.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.indexes.has(key);
  }

  /**
   * Get an item by key.
   * @param {string} key
   * @returns {T | undefined}
   */
  get(key) {
    const index = this.indexes.get(key);
    return index !== undefined ? this.data[index] : undefined;
  }

  /**
   * Remove all items.
   */
  clear() {
    this.data = [];
    this.indexes.clear();
  }

  /**
   * Get item count.
   * @returns {number}
   */
  get size() {
    return this.data.length;
  }

  /**
   * Iterate over items (arbitrary heap order).
   * @returns {IterableIterator<T>}
   */
  *[Symbol.iterator]() {
    yield* this.data;
  }
}
