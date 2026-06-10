
import http from 'http';

async function checkApiChat() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: 'Vreau o ofertă pentru panouri fotovoltaice.' });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'http://localhost:3000'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('API Chat Status:', res.statusCode);
        console.log('API Chat Response:', body);
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', (e) => {
      console.error('API Chat Request Error:', e);
      reject(e);
    });
    req.write(data);
    req.end();
  });
}

async function checkHeaders() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/index.html', (res) => {
      console.log('Index.html Cache-Control:', res.headers['cache-control']);
      resolve(res.headers);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Waiting for server to be ready...');
  await new Promise(r => setTimeout(r, 2000));
  try {
    await checkApiChat();
    await checkHeaders();
  } catch (e) {
    console.error('Error during smoke test:', e);
  }
}

main();
