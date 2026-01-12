import { strict as assert } from "node:assert";
import { test } from "node:test";
import { UniQueue } from "./dist/index.js";

test("UniQueue - Basic push/pop/peek (Min Heap)", () => {
  const q = new UniQueue({ compare: (a, b) => a.val - b.val });
  q.push({ id: "a", val: 10 });
  q.push({ id: "b", val: 5 });
  q.push({ id: "c", val: 20 });

  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 5); // Min value is top

  assert.equal(q.pop().val, 5);
  assert.equal(q.peek().val, 10);
  assert.equal(q.pop().val, 10);
  assert.equal(q.pop().val, 20);
  assert.equal(q.size, 0);
  assert.equal(q.pop(), undefined);
});

test("UniQueue - Unique Key Constraint (Update)", () => {
  const q = new UniQueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id,
  });

  q.push({ id: "a", val: 10 });
  q.push({ id: "a", val: 5 }); // Update (better / up)

  assert.equal(q.size, 1);
  assert.equal(q.peek().val, 5);

  q.push({ id: "a", val: 15 }); // Update (worse / down) - explicit update
  assert.equal(q.peek().val, 15);
});

test("UniQueue - Max Size Eviction", () => {
  // Max Heap behavior for eviction test (Leaderboard style: keep top N)
  // But wait, UniQueue evicts the ROOT (min).
  // If we want to keep Top N High Scores, we use a Min-Heap of size N.
  // The root is the lowest of the high scores.
  // When we push a new score, if it's > root, we pop root (min) and push new.
  // UniQueue logic: push adds item. If size > maxSize, returns pop().
  // If pop() returns the item we just pushed (because it was smallest), then we correctly rejected it.

  const q = new UniQueue({
    maxSize: 3,
    compare: (a, b) => a.val - b.val, // Min-Heap
    extractKey: (item) => item.id,
  });

  q.push({ id: "a", val: 10 });
  q.push({ id: "b", val: 20 });
  q.push({ id: "c", val: 30 });
  // Queue: [10, 20, 30] (roughly)

  const evicted1 = q.push({ id: "d", val: 5 }); // 5 is smaller than 10.
  // Pushed 5. Queue becomes [5, 10, 20, 30]. Pop 5.
  assert.deepEqual(evicted1, { id: "d", val: 5 });
  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 10); // 10 is still min of the queue

  const evicted2 = q.push({ id: "e", val: 25 }); // 25 is > 10.
  // Pushed 25. Queue has 4 items. Min is 10. Pop 10.
  assert.deepEqual(evicted2, { id: "a", val: 10 });
  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 20); // Now min is 20
});

test("UniQueue - get / has / size / clear", () => {
  const q = new UniQueue({ extractKey: (item) => item.id });
  q.push({ id: "a", val: 1 });
  q.push({ id: "b", val: 2 });

  assert.equal(q.has("a"), true);
  assert.equal(q.has("c"), false);

  assert.deepEqual(q.get("b"), { id: "b", val: 2 });
  assert.equal(q.get("c"), undefined);

  assert.equal(q.size, 2);
  q.clear();
  assert.equal(q.size, 0);
  assert.equal(q.has("a"), false);
});

test("UniQueue - remove", () => {
  const q = new UniQueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id,
  });
  q.push({ id: "a", val: 10 });
  q.push({ id: "b", val: 5 }); // root
  q.push({ id: "c", val: 20 });
  q.push({ id: "d", val: 15 });

  // Remove root (5)
  assert.equal(q.remove("b"), true);
  assert.equal(q.has("b"), false);
  assert.equal(q.peek().val, 10); // Next min

  // Remove leaf
  assert.equal(q.remove("c"), true); // 20
  assert.equal(q.has("c"), false);

  // Remove non-existent
  assert.equal(q.remove("z"), false);

  assert.equal(q.size, 2);
});

test("UniQueue - Iterator", () => {
  const q = new UniQueue({ extractKey: (item) => item.id });
  q.push({ id: "a", val: 1 });
  q.push({ id: "b", val: 2 });
  q.push({ id: "c", val: 3 });

  const items = [...q];
  assert.equal(items.length, 3);
  assert.ok(items.find((i) => i.id === "a"));
  assert.ok(items.find((i) => i.id === "b"));
  assert.ok(items.find((i) => i.id === "c"));
});

test("UniQueue - Stress Test (Heap Integrity)", () => {
  const q = new UniQueue({ compare: (a, b) => a - b });
  const input = Array.from({ length: 1000 }, () =>
    Math.floor(Math.random() * 10000),
  );

  // Push all
  input.forEach((v) => q.push(v));

  // Check heap property manually
  const data = q.data;
  for (let i = 1; i < data.length; i++) {
    const parent = (i - 1) >>> 1;
    assert.ok(data[parent] <= data[i], `Heap property violated at index ${i}`);
  }

  // Check sort order by popping
  let prev = -Infinity;
  while (q.size > 0) {
    const curr = q.pop();
    assert.ok(curr >= prev, "Pop order violated");
    prev = curr;
  }
});

test("UniQueue - Payload Update (Same Priority)", () => {
  const q = new UniQueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id,
  });

  q.push({ id: "a", val: 10, payload: "v1" });
  assert.equal(q.peek().payload, "v1");

  // Update with same priority but new payload
  q.push({ id: "a", val: 10, payload: "v2" });

  assert.equal(q.size, 1);
  assert.equal(q.peek().val, 10);
  assert.equal(q.peek().payload, "v2"); // Should be updated
});
