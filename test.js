import { strict as assert } from "node:assert";
import { test } from "node:test";
import { Uniqueue } from "./dist/index.js";

test("Uniqueue - Basic push/pop/peek (Min Heap)", () => {
  const q = new Uniqueue({ compare: (a, b) => a.val - b.val });
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

test("Uniqueue - Unique Key Constraint (Update)", () => {
  const q = new Uniqueue({
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

test("Uniqueue - Max Size Eviction", () => {
  const q = new Uniqueue({
    maxSize: 3,
    compare: (a, b) => a.val - b.val, // Min-Heap
    extractKey: (item) => item.id,
  });

  q.push({ id: "a", val: 10 });
  q.push({ id: "b", val: 20 });
  q.push({ id: "c", val: 30 });

  const evicted1 = q.push({ id: "d", val: 5 });
  assert.deepEqual(evicted1, { id: "d", val: 5 });
  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 10);

  const evicted2 = q.push({ id: "e", val: 25 });
  assert.deepEqual(evicted2, { id: "a", val: 10 });
  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 20);
});

test("Uniqueue - get / has / size / clear", () => {
  const q = new Uniqueue({ extractKey: (item) => item.id });
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

test("Uniqueue - remove", () => {
  const q = new Uniqueue({
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

test("Uniqueue - Iterator", () => {
  const q = new Uniqueue({ extractKey: (item) => item.id });
  q.push({ id: "a", val: 1 });
  q.push({ id: "b", val: 2 });
  q.push({ id: "c", val: 3 });

  const items = [...q];
  assert.equal(items.length, 3);
  assert.ok(items.find((i) => i.id === "a"));
  assert.ok(items.find((i) => i.id === "b"));
  assert.ok(items.find((i) => i.id === "c"));
});

test("Uniqueue - Stress Test (Heap Integrity)", () => {
  const q = new Uniqueue({ compare: (a, b) => a - b });
  const input = Array.from({ length: 1000 }, () =>
    Math.floor(Math.random() * 10000),
  );

  // Push all
  input.forEach((v) => q.push(v));

  // Check heap property manually
  const data = q.snapshot();
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

test("Uniqueue - Payload Update (Same Priority)", () => {
  const q = new Uniqueue({
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

test("Generic Key - Number keys", () => {
  const q = new Uniqueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id, // number key
  });

  q.push({ id: 1, val: 10 });
  q.push({ id: 2, val: 5 });
  q.push({ id: 1, val: 3 }); // Update by number key

  assert.equal(q.size, 2);
  assert.equal(q.peek().val, 3);
  assert.equal(q.has(1), true);
  assert.equal(q.has(3), false);
  assert.deepEqual(q.get(2), { id: 2, val: 5 });
});

test("Generic Key - Symbol keys", () => {
  const KEY_A = Symbol("a");
  const KEY_B = Symbol("b");

  const q = new Uniqueue({
    extractKey: (item) => item.key,
  });

  q.push({ key: KEY_A, val: 1 });
  q.push({ key: KEY_B, val: 2 });
  q.push({ key: KEY_A, val: 99 }); // Update

  assert.equal(q.size, 2);
  assert.equal(q.has(KEY_A), true);
  assert.equal(q.get(KEY_A).val, 99);
});

test("Generic Key - Object keys (reference equality)", () => {
  const keyObj1 = { id: 1 };
  const keyObj2 = { id: 2 };

  const q = new Uniqueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.ref,
  });

  q.push({ ref: keyObj1, val: 10 });
  q.push({ ref: keyObj2, val: 5 });
  q.push({ ref: keyObj1, val: 1 }); // Same reference

  assert.equal(q.size, 2);
  assert.equal(q.peek().val, 1);
  assert.equal(q.has(keyObj1), true);
  assert.equal(q.has({ id: 1 }), false); // Different reference
});

// ==================== EDGE CASES ====================

test("Edge - Empty queue operations", () => {
  const q = new Uniqueue({ compare: (a, b) => a - b });

  assert.equal(q.pop(), undefined);
  assert.equal(q.peek(), undefined);
  assert.equal(q.size, 0);
});

test("Edge - maxSize = 1", () => {
  const q = new Uniqueue({
    maxSize: 1,
    compare: (a, b) => a - b,
  });

  q.push(10);
  assert.equal(q.size, 1);

  const evicted = q.push(5);
  assert.equal(evicted, 5); // 5 is min, evicted
  assert.equal(q.peek(), 10);

  const evicted2 = q.push(20);
  assert.equal(evicted2, 10); // 10 is min, evicted
  assert.equal(q.peek(), 20);
});

test("Edge - Constructor with initial data", () => {
  const q = new Uniqueue({
    data: [
      { id: "c", val: 30 },
      { id: "a", val: 10 },
      { id: "b", val: 20 },
    ],
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id,
  });

  assert.equal(q.size, 3);
  assert.equal(q.peek().val, 10); // Heapified
});

test("Edge - Constructor deduplicates initial data", () => {
  const q = new Uniqueue({
    data: [
      { id: "a", val: 1 },
      { id: "a", val: 2 },
      { id: "b", val: 3 },
    ],
    extractKey: (item) => item.id,
  });

  assert.equal(q.size, 2);
  assert.equal(q.get("a").val, 1); // First wins
});

test("snapshot() - returns isolated copy", () => {
  const q = new Uniqueue({
    compare: (a, b) => a.val - b.val,
    extractKey: (item) => item.id,
  });

  q.push({ id: "a", val: 10 });
  q.push({ id: "b", val: 5 });
  q.push({ id: "c", val: 20 });

  const snap = q.snapshot();

  // Mutate snapshot order
  snap.sort((a, b) => b.val - a.val);

  // Original heap unchanged
  assert.equal(q.peek().val, 5);
  assert.equal(snap[0].val, 20);
});
