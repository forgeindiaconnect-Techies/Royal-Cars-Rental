import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// --- COPY USER IMAGE FROM DOWNLOADS ---
try {
  const sourceFile = 'C:\\\\Users\\\\Forgeindiaconnect\\\\Downloads\\\\My-Project-image-ai.png';
  const destFile = path.resolve(__dirname, 'src', 'assets', 'ai-hero-graphic.png');
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, destFile);
    console.log('✅ Found user image in Downloads and copied it to assets!');
  }

  const brainSourceFile = 'C:\\\\Users\\\\Forgeindiaconnect\\\\.gemini\\\\antigravity-ide\\\\brain\\\\0aa34e8c-97e1-4537-8673-7565bbe73fc6\\\\faq_vector_car_1786087316733.png';
  const brainDestFile = path.resolve(__dirname, 'public', 'faq-vector-car.png');
  if (fs.existsSync(brainSourceFile)) {
    fs.copyFileSync(brainSourceFile, brainDestFile);
    console.log('✅ Copied generated FAQ vector car to public!');
  }

  // --- NEW: COPY FAQ.png FROM DOWNLOADS ---
  const userFaqSourceFile = 'C:\\\\Users\\\\Forgeindiaconnect\\\\Downloads\\\\FAQ.png';
  const userFaqDestFile = path.resolve(__dirname, 'public', 'FAQ.png');
  if (fs.existsSync(userFaqSourceFile)) {
    fs.copyFileSync(userFaqSourceFile, userFaqDestFile);
    console.log('✅ Copied FAQ.png from Downloads to public!');
  }

  // --- NEW: COPY About-us.png FROM DOWNLOADS ---
  const userAboutUsSourceFile = 'C:\\\\Users\\\\Forgeindiaconnect\\\\Downloads\\\\About-us.png';
  const userAboutUsDestFile = path.resolve(__dirname, 'public', 'About-us.png');
  if (fs.existsSync(userAboutUsSourceFile)) {
    fs.copyFileSync(userAboutUsSourceFile, userAboutUsDestFile);
    console.log('✅ Copied updated About-us.png from Downloads to public!');
  }
} catch (e) {
  console.error('Failed to copy image:', e);
}
// --------------------------------------

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
