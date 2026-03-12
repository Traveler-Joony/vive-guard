// Complexity: 19
// Branches: 2 for + 1 if + 1 && + 4 case + 3 if + 1 || + 1 for + 1 if + 1 catch + 1 ternary + 1 if + 1 &&
function processRecords(
  records: Array<{ type: string; value: number; tags?: string[] }>,
  config: { strict: boolean; maxRetries: number },
): { processed: number; errors: number } {
  let processed = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    if (record.value < 0 && config.strict) {
      errors++;
      continue;
    }

    switch (record.type) {
      case 'alpha':
        if (record.value > 100) {
          processed += record.value * 2;
        } else if (record.value > 50) {
          processed += record.value;
        } else {
          processed++;
        }
        break;
      case 'beta':
        for (let retry = 0; retry < config.maxRetries; retry++) {
          try {
            if (record.value % 2 === 0 || record.tags?.length) {
              processed += record.value;
              break;
            }
          } catch (e) {
            errors++;
          }
        }
        break;
      case 'gamma':
        processed += record.tags ? record.tags.length : 0;
        break;
      case 'delta':
        if (record.value > 0) {
          processed += Math.sqrt(record.value);
        }
        break;
    }
  }

  for (const record of records) {
    if (record.tags && record.tags.length > 0) {
      processed++;
    }
  }

  return { processed, errors };
}

// Complexity: 3 (simple function for contrast)
function summarize(results: { processed: number; errors: number }): string {
  if (results.errors > 0) {
    if (results.errors > results.processed) {
      return 'critical';
    }
    return 'warning';
  }
  return 'ok';
}
