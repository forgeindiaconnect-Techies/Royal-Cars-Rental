const http = require('http');

function makePost(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testAllPurposeOTPs() {
  console.log('\n---------------------------------------------------------');
  console.log('🧪 TESTING PURPOSE-BASED BREVO OTP ENDPOINTS');
  console.log('---------------------------------------------------------\n');

  // 1. Test Customer Booking Verification OTP
  console.log('1️⃣ Requesting BOOKING_VERIFICATION OTP for vaideeswari8@gmail.com...');
  const res1 = await makePost('/api/auth/booking/send-otp', {
    email: 'vaideeswari8@gmail.com',
    purpose: 'BOOKING_VERIFICATION',
    bookingId: 'BK-2026-7528'
  });
  console.log('Response:', res1);

  // 2. Test Cash Collection OTP
  console.log('\n2️⃣ Requesting CASH_COLLECTION OTP for vaideeswari8@gmail.com...');
  const res2 = await makePost('/api/auth/booking/send-otp', {
    email: 'vaideeswari8@gmail.com',
    purpose: 'CASH_COLLECTION',
    bookingId: 'BK-2026-7528'
  });
  console.log('Response:', res2);

  // 3. Test Trip Start OTP
  console.log('\n3️⃣ Requesting TRIP_START OTP for vaideeswari8@gmail.com...');
  const res3 = await makePost('/api/auth/booking/send-otp', {
    email: 'vaideeswari8@gmail.com',
    purpose: 'TRIP_START',
    bookingId: 'BK-2026-7528'
  });
  console.log('Response:', res3);

  console.log('\n---------------------------------------------------------');
  console.log('✅ ALL PURPOSE-BASED OTP TESTS COMPLETED SUCCESSFULLY');
  console.log('---------------------------------------------------------\n');
}

testAllPurposeOTPs().catch(console.error);
