export interface UniqueueOptions<T, K = string> {
  data?: T[];
  maxSize?: number;
  compare?: (a: T, b: T) => number;
  extractKey?: (item: T) => K;
}

export class Uniqueue<T, K = string> {
  data: T[];
  indexes: Map<K, number>;

  #maxSize: number;
  #compare: (a: T, b: T) => number;
  #extractKey: (item: T) => K;

  constructor({
    data = [],
    maxSize = Infinity,
    compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0),
    extractKey = (item) => item as unknown as K,
  }: UniqueueOptions<T, K> = {}) {
    this.#maxSize = maxSize;
    this.#compare = compare;
    this.#extractKey = extractKey;

    this.data = [];
    this.indexes = new Map();

    for (const item of data) {
      const key = extractKey(item);
      if (!this.indexes.has(key)) {
        this.indexes.set(key, this.data.length);
        this.data.push(item);
      }
    }

    if (this.data.length > 0) {
      for (let i = (this.data.length >>> 1) - 1; i >= 0; i--) {
        this.#siftDown(i);
      }
    }
  }

  #siftUp(pos: number): void {
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

  #siftDown(pos: number): void {
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

  push(item: T): T | undefined {
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

  pop(): T | undefined {
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

  peek(): T | undefined {
    return this.data[0];
  }

  remove(key: K): boolean {
    const index = this.indexes.get(key);
    if (index === undefined) return false;

    const lastIndex = this.data.length - 1;
    if (index === lastIndex) {
      this.indexes.delete(key);
      this.data.pop();
      return true;
    }

    const item = this.data.pop() as T;
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

  has(key: K): boolean {
    return this.indexes.has(key);
  }

  get(key: K): T | undefined {
    const index = this.indexes.get(key);
    return index !== undefined ? this.data[index] : undefined;
  }

  clear(): void {
    this.data = [];
    this.indexes.clear();
  }

  get size(): number {
    return this.data.length;
  }

  *[Symbol.iterator](): IterableIterator<T> {
    yield* this.data;
  }
}
