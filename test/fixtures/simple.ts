// Complexity: 1 (no branches)
function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Complexity: 2 (1 if)
function isPositive(n: number): boolean {
  if (n > 0) {
    return true;
  }
  return false;
}

// Complexity: 3 (2 if branches)
function classify(n: number): string {
  if (n > 0) {
    return 'positive';
  } else if (n < 0) {
    return 'negative';
  }
  return 'zero';
}

// Complexity: 1 (arrow function, no branches)
const add = (a: number, b: number): number => a + b;
