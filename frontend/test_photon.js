const https = require('https');

https.get('https://photon.komoot.io/api/?q=Dharmapuri&limit=5', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});
