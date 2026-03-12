export async function loadConfig() {
  return fetch('/api/config')
    .then(res => res.json())
    .catch(err => {
      console.error('Config load failed', err);
      return {};
    });
}

export async function sendEvent(event: string) {
  return fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify({ event }),
  })
    .then(res => res.json())
    .catch(err => {
      console.error('Event send failed', err);
      return null;
    });
}
