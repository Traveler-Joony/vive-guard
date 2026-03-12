// File B: contains a duplicated block shared with duplicate-a.ts

export function handleUserRecords(users: { name: string; age: number; active: boolean }[]) {
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

export function uniqueToB(a: string, b: string): boolean {
  return a.startsWith(b) || a.endsWith(b);
}
