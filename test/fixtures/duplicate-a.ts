// File A: contains a duplicated block shared with duplicate-b.ts

export function processUserData(users: { name: string; age: number; active: boolean }[]) {
  const result: string[] = [];
  for (const user of users) {
    if (user.active && user.age >= 18) {
      const formatted = user.name.trim().toLowerCase();
      const label = `User: ${formatted} (age: ${user.age})`;
      result.push(label);
    } else if (user.age < 0) {
      throw new Error('Invalid age: ' + user.age);
    }
  }
  return result.filter(item => item.length > 0);
}

export function uniqueToA(x: number): number {
  return x * x + Math.sqrt(x) - 42;
}
