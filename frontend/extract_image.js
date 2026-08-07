const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\Forgeindiaconnect\\.gemini\\antigravity-ide\\brain\\0691647b-4c11-4fe4-8142-bb31dd99e0d1\\.tempmediaStorage';
const destDir = 'C:\\Users\\Forgeindiaconnect\\OneDrive\\Documents\\My-Projects\\RentOS-car-Project\\frontend\\public';

// Ensure public directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

try {
    // Get all files in source directory
    const files = fs.readdirSync(sourceDir)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
        .map(f => ({ name: f, time: fs.statSync(path.join(sourceDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length > 0) {
        const latestFile = files[0].name;
        const destFile = path.join(destDir, 'ai-hero-graphic.png');
        
        fs.copyFileSync(path.join(sourceDir, latestFile), destFile);
        console.log('\n======================================================');
        console.log('✅ Successfully extracted the EXACT image you provided!');
        console.log('✅ Saved it to: frontend/public/ai-hero-graphic.png');
        console.log('======================================================\n');
    } else {
        console.log('❌ Could not find the attached image.');
    }
} catch (error) {
    console.error('Error:', error.message);
}
