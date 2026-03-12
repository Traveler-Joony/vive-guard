export async function fetchUser(id: number) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user', error);
    return null;
  }
}

export async function saveUser(user: { name: string }) {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save user', error);
    throw error;
  }
}
