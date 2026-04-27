import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

/**
 * Ensure data directory exists
 * Creates it if it doesn't exist
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load store data from persistent JSON file
 * Returns default store structure if file doesn't exist
 */
export function loadStore() {
  ensureDataDir();

  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      console.log('✓ Store loaded from file');
      return data;
    } else {
      console.log('ℹ No existing store found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('✗ Error loading store:', error);
    return null;
  }
}

/**
 * Save entire store to persistent JSON file
 * Called after any data modification (CRUD operations)
 */
export function saveStore(data: any) {
  ensureDataDir();

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('✓ Store saved to file');
  } catch (error) {
    console.error('✗ Error saving store:', error);
    throw new Error('Failed to persist data');
  }
}

/**
 * Get current data file path
 * Useful for debugging and testing
 */
export function getDataFilePath(): string {
  return DATA_FILE;
}
