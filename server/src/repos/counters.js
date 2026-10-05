'use strict';
const { collection } = require('../db');
const { nowIso } = require('../utils/ids');

/** Atomic-ish incrementing counter used for human readable reference numbers. */
async function nextSequence(name, startAt = 1000) {
  const counters = collection('counters');
  const existing = await counters.findById(name);
  if (!existing) {
    await counters.insert({ _id: name, value: startAt, createdAt: nowIso(), updatedAt: nowIso() });
    return startAt;
  }
  const value = Number(existing.value || startAt) + 1;
  await counters.updateById(name, { value });
  return value;
}

module.exports = { nextSequence };
