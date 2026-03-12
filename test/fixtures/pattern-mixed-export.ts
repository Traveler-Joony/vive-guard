export function validate(input: string): boolean {
  return input.length > 0;
}

export function sanitize(input: string): string {
  return input.trim();
}

function defaultHandler(input: string) {
  return validate(input) ? sanitize(input) : '';
}

export default defaultHandler;
