export async function getData() {
  const response = await fetch('/api/data');
  return response.json();
}

export async function postData(payload: unknown) {
  const response = await fetch('/api/data', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.json();
}
