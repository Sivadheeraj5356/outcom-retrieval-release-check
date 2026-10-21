# Outcom Retrieval Release Check

A small Node.js utility for the Stealth Startup | Enterprise AI software engineering internship application. It checks whether an enterprise retrieval run is ready to ship by validating source coverage, citation grounding, failed integrations, and answer latency.

The sample models an enterprise copilot reading SAP, Salesforce, and Google Drive. The checker returns a machine-readable readiness verdict that a CI job can use before a retrieval or integration change reaches production.

## Run

```bash
npm test
```

## Input shape

- `sources[]`: connected systems with `id`, `system`, and `status`.
- `answers[]`: generated answers with `query`, `text`, source `citations`, and `latencyMs`.

A run is ready only when every answer cites a known source, no source failed, and every answer is within the configured latency budget.
