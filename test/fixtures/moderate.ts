// Complexity: 6 (for + 3 if + 1 &&)
function filterAndTransform(items: number[]): number[] {
  const result: number[] = [];
  for (const item of items) {
    if (item > 0 && item < 100) {
      if (item % 2 === 0) {
        result.push(item * 2);
      } else {
        result.push(item);
      }
    }
    if (item === 0) {
      result.push(-1);
    }
  }
  return result;
}

// Complexity: 7 (switch with 5 cases + 1 if)
function getDayType(day: string): string {
  let type: string;
  switch (day) {
    case 'Monday':
      type = 'start';
      break;
    case 'Tuesday':
    case 'Wednesday':
    case 'Thursday':
      type = 'middle';
      break;
    case 'Friday':
      type = 'end';
      break;
    default:
      type = 'weekend';
  }
  if (type === 'weekend') {
    return 'rest day';
  }
  return type;
}

// Complexity: 8 (while + for + 3 if + 2 ||)
function processQueue(queue: number[]): number[] {
  const output: number[] = [];
  let index = 0;
  while (index < queue.length) {
    const val = queue[index];
    if (val < 0 || val > 1000) {
      index++;
      continue;
    }
    for (let i = 0; i < val; i++) {
      if (i % 3 === 0 || i % 5 === 0) {
        output.push(i);
      }
    }
    if (output.length > 100) {
      break;
    }
    index++;
  }
  return output;
}
