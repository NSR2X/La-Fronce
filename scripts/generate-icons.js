import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base64 encoded PNG images (simple colored squares)
// 192x192 blue square
const icon192Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAABlApw1AAAABlBMVEUPFyokY+vvWQWnAAAAZElEQVR4nO3BMQEAAADCoPVPbQsvoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBnAK1QAAGbCXdOAAAAAElFTkSuQmCC';

// 512x512 blue square
const icon512Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAMAAADDpiTIAAAABlBMVEUPFyokY+vvWQWnAAAAe0lEQVR4nO3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+BjwhwAAef6eXgAAAABJRU5ErkJggg==';

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write icon files
fs.writeFileSync(
  path.join(iconsDir, 'icon-192.png'),
  Buffer.from(icon192Base64, 'base64')
);

fs.writeFileSync(
  path.join(iconsDir, 'icon-512.png'),
  Buffer.from(icon512Base64, 'base64')
);

console.log('Icons generated successfully!');
