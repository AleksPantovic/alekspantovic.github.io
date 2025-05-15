// Call Haiilo API directly (browser session)
fetch('/api/users', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Browser session fetched users:', data))
.catch(error => console.error('Error:', error));
