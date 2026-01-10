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
export class UniQueue<T> {
    [x: number]: () => IterableIterator<T>;
    /**
     * @param {UniQueueOptions<T>} [options]
     */
    constructor({ data, maxSize, compare, extractKey, }?: UniQueueOptions<T>);
    /** @type {T[]} */
    data: T[];
    /** @type {Map<string, number>} */
    indexes: Map<string, number>;
    /**
     * Add or update an item in the queue.
     * - If key exists: Updates item and rebalances (unconditional update).
     * - If key new: Adds item. If size > maxSize, evicts and returns min item.
     * @param {T} item
     * @returns {T | undefined} Evicted item if queue was full
     */
    push(item: T): T | undefined;
    /**
     * Remove and return the top (minimum) item.
     * @returns {T | undefined}
     */
    pop(): T | undefined;
    /**
     * Return the top (minimum) item without removing it.
     * @returns {T | undefined}
     */
    peek(): T | undefined;
    /**
     * Remove an item by key.
     * @param {string} key
     * @returns {boolean} true if item was removed
     */
    remove(key: string): boolean;
    /**
     * Check if an item exists.
     * @param {string} key
     * @returns {boolean}
     */
    has(key: string): boolean;
    /**
     * Get an item by key.
     * @param {string} key
     * @returns {T | undefined}
     */
    get(key: string): T | undefined;
    /**
     * Remove all items.
     */
    clear(): void;
    /**
     * Get item count.
     * @returns {number}
     */
    get size(): number;
    #private;
}
export type UniQueueOptions<T> = {
    /**
     * - Initial data array
     */
    data?: T[];
    /**
     * - Maximum queue size (default: Infinity)
     */
    maxSize?: number;
    /**
     * - Comparison function for heap ordering
     */
    compare?: (a: T, b: T) => number;
    /**
     * - Function to extract unique key from item
     */
    extractKey?: (item: T) => string;
};
