const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const INPUT_DIR = path.join(__dirname, '../');
const OUTPUT_DIR = path.join(__dirname, '../public/audio');
const KEY_FILE_DIR = path.join(__dirname, '../src/config');
const KEY_FILE = path.join(KEY_FILE_DIR, 'keys.json');

// Track configurations
const TRACKS = [
  { input: 'track.mp3', output: 'track.enc', keyId: 'track' },
  { input: 'track2.mp3', output: 'track2.enc', keyId: 'track2' },
  { input: 'track3.mp3', output: 'track3.enc', keyId: 'track3' }
];

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(KEY_FILE_DIR)) {
  fs.mkdirSync(KEY_FILE_DIR, { recursive: true });
}

let keys = {};
// Load existing keys if they exist to preserve them if we only update one file
if (fs.existsSync(KEY_FILE)) {
    try {
        keys = JSON.parse(fs.readFileSync(KEY_FILE));
    } catch (e) {
        console.log('Could not read existing keys, starting fresh.');
    }
}

TRACKS.forEach(track => {
  const inputFile = path.join(INPUT_DIR, track.input);
  const outputFile = path.join(OUTPUT_DIR, track.output);

  if (!fs.existsSync(inputFile)) {
    console.log(`⚠️  ${track.input} not found. Skipping...`);
    // Create dummy if it doesn't exist for first run convenience, but warn user
    if (!fs.existsSync(outputFile)) {
         console.log(`   Creating dummy ${track.input} for testing.`);
         fs.writeFileSync(inputFile, `Dummy content for ${track.title || track.input}`);
    } else {
        return;
    }
  }

  try {
    // Generate Key (32 bytes for AES-256) and IV (12 bytes for GCM)
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // Create Cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Read Input
    const input = fs.readFileSync(inputFile);

    // Encrypt
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);

    // Get Auth Tag (16 bytes)
    const authTag = cipher.getAuthTag();

    // Combine: Encrypted Data + Auth Tag
    const finalBuffer = Buffer.concat([encrypted, authTag]);

    // Write Encrypted File
    fs.writeFileSync(outputFile, finalBuffer);

    // Save Keys
    keys[track.keyId] = {
      key: key.toString('base64'),
      iv: iv.toString('base64')
    };

    console.log(`✅ Encrypted ${track.input} -> ${track.output}`);

  } catch (error) {
    console.error(`❌ Failed to encrypt ${track.input}:`, error);
  }
});

fs.writeFileSync(KEY_FILE, JSON.stringify(keys, null, 2));
console.log(`\nKeys saved to ${KEY_FILE}`);
