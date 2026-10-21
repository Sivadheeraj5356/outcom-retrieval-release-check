export function validateRun(run) {
  const errors = [];
  if (!run || typeof run !== 'object') return ['run must be an object'];
  if (!run.pipeline || typeof run.pipeline !== 'string') errors.push('pipeline is required');
  if (!Array.isArray(run.sources) || run.sources.length === 0) errors.push('at least one source is required');
  if (!Array.isArray(run.answers) || run.answers.length === 0) errors.push('at least one answer is required');

  const sourceIds = new Set((run.sources || []).map((source) => source.id));
  for (const [index, source] of (run.sources || []).entries()) {
    if (!source.id) errors.push(`sources[${index}].id is required`);
    if (!source.system) errors.push(`sources[${index}].system is required`);
    if (!['indexed', 'failed'].includes(source.status)) errors.push(`sources[${index}].status must be indexed or failed`);
  }
  for (const [index, answer] of (run.answers || []).entries()) {
    if (!answer.query) errors.push(`answers[${index}].query is required`);
    if (!answer.text) errors.push(`answers[${index}].text is required`);
    if (!Array.isArray(answer.citations) || answer.citations.length === 0) {
      errors.push(`answers[${index}].citations must include at least one source id`);
    } else {
      for (const citation of answer.citations) {
        if (!sourceIds.has(citation)) errors.push(`answers[${index}] cites missing source ${citation}`);
      }
    }
    if (typeof answer.latencyMs !== 'number' || answer.latencyMs < 0) errors.push(`answers[${index}].latencyMs must be a non-negative number`);
  }
  return errors;
}

export function scoreRun(run, limits = {}) {
  const errors = validateRun(run);
  const maxLatencyMs = limits.maxLatencyMs ?? 3000;
  const failedSources = (run.sources || []).filter((source) => source.status === 'failed').length;
  const slowAnswers = (run.answers || []).filter((answer) => answer.latencyMs > maxLatencyMs).length;
  const groundedAnswers = (run.answers || []).filter((answer) => (answer.citations || []).length > 0).length;
  return {
    ready: errors.length === 0 && failedSources === 0 && slowAnswers === 0,
    errors,
    metrics: {
      sources: (run.sources || []).length,
      failedSources,
      answers: (run.answers || []).length,
      groundedAnswers,
      slowAnswers,
      maxLatencyMs
    }
  };
}
