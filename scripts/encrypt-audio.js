const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const INPUT_FILE = path.join(__dirname, '../track.mp3');
const OUTPUT_DIR = path.join(__dirname, '../public/audio');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'track.enc');
const KEY_FILE_DIR = path.join(__dirname, '../src/config');
const KEY_FILE = path.join(KEY_FILE_DIR, 'keys.json');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(KEY_FILE_DIR)) {
  fs.mkdirSync(KEY_FILE_DIR, { recursive: true });
}

if (!fs.existsSync(INPUT_FILE)) {
  console.log('No track.mp3 found. Creating a dummy file for demonstration...');
  fs.writeFileSync(INPUT_FILE, 'This is dummy audio content for testing encryption.');
}

try {
  // Generate Key (32 bytes for AES-256) and IV (12 bytes for GCM)
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // Create Cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Read Input
  const input = fs.readFileSync(INPUT_FILE);

  // Encrypt
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

  // Get Auth Tag (16 bytes)
  const authTag = cipher.getAuthTag();

  // Combine: Encrypted Data + Auth Tag
  // Web Crypto API expects the tag at the end of the ciphertext for AES-GCM
  const finalBuffer = Buffer.concat([encrypted, authTag]);

  // Write Encrypted File
  fs.writeFileSync(OUTPUT_FILE, finalBuffer);

  // Save Keys
  // We save as base64 strings to easily load in frontend
  const keyData = {
    key: key.toString('base64'),
    iv: iv.toString('base64')
  };

  fs.writeFileSync(KEY_FILE, JSON.stringify(keyData, null, 2));

  console.log('✅ Encryption complete!');
  console.log(`- Encrypted file: ${OUTPUT_FILE}`);
  console.log(`- Keys: ${KEY_FILE}`);
  console.log('Replace track.mp3 with your actual file and run this script again before deploying.');

} catch (error) {
  console.error('❌ Encryption failed:', error);
  process.exit(1);
}
