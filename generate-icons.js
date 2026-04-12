import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  const sourceImage = 'assets/icon.png';
  
  if (!fs.existsSync(sourceImage)) {
    console.log('Source image assets/icon.png not found. Creating a professional placeholder...');
    // Create a professional placeholder icon
    const svg = `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" rx="200" fill="#1e40af" />
        <text x="512" y="300" font-family="Arial" font-size="120" font-weight="bold" fill="white" text-anchor="middle">BILLBOOK</text>
        <path d="M300 400 h424 v400 h-424 z" fill="#f8fafc" />
        <rect x="350" y="450" width="324" height="20" fill="#cbd5e1" />
        <rect x="350" y="500" width="324" height="20" fill="#cbd5e1" />
        <rect x="350" y="550" width="200" height="20" fill="#cbd5e1" />
        <text x="512" y="900" font-family="Arial" font-size="150" font-weight="bold" fill="white" text-anchor="middle">PRO</text>
      </svg>
    `;
    await sharp(Buffer.from(svg))
      .png()
      .toFile(sourceImage);
  }

  const resDir = 'android/app/src/main/res';

  for (const [folder, size] of Object.entries(SIZES)) {
    const targetDir = path.join(resDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    await sharp(sourceImage)
      .resize(size, size)
      .toFile(path.join(targetDir, 'ic_launcher.png'));
      
    await sharp(sourceImage)
      .resize(size, size)
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));
      
    console.log(`Generated icons for ${folder} (${size}x${size})`);
  }

  // Also generate web favicon
  await sharp(sourceImage)
    .resize(32, 32)
    .toFile('public/favicon.ico');
    
  console.log('Generated web favicon');
}

generateIcons().catch(console.error);
