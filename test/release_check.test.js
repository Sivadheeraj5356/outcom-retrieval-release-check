import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRun, validateRun } from '../src/release_check.js';

const sample = {
  pipeline: 'enterprise-policy-copilot',
  sources: [
    { id: 'sap-invoices', system: 'SAP', status: 'indexed' },
    { id: 'salesforce-accounts', system: 'Salesforce', status: 'indexed' },
    { id: 'drive-policies', system: 'Google Drive', status: 'indexed' }
  ],
  answers: [
    { query: 'Which invoices are blocked?', text: 'Two invoices are blocked by missing goods receipts.', citations: ['sap-invoices'], latencyMs: 820 },
    { query: 'Who owns the Acme renewal?', text: 'The Salesforce account owner is Priya Shah.', citations: ['salesforce-accounts', 'drive-policies'], latencyMs: 940 }
  ]
};

test('accepts a grounded enterprise retrieval run', () => {
  const result = scoreRun(sample, { maxLatencyMs: 1200 });
  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.metrics.groundedAnswers, 2);
});

test('rejects answers that cite unknown sources', () => {
  const broken = structuredClone(sample);
  broken.answers[0].citations = ['missing-system'];
  assert.deepEqual(validateRun(broken), ['answers[0] cites missing source missing-system']);
});

test('marks slow or failed pipelines not ready', () => {
  const broken = structuredClone(sample);
  broken.sources[1].status = 'failed';
  broken.answers[0].latencyMs = 5000;
  const result = scoreRun(broken, { maxLatencyMs: 1200 });
  assert.equal(result.ready, false);
  assert.equal(result.metrics.failedSources, 1);
  assert.equal(result.metrics.slowAnswers, 1);
});
