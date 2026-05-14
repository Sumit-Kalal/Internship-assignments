import bcrypt from 'bcryptjs';
import { loadStore, saveStore } from '../utils/persistence.js';

/**
 * Default store structure
 * Used when no persistent data exists
 */
const defaultStore = {
  users: [
    {
      id: 'admin1',
      email: 'admin@gmail.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'Admin',
      name: 'System Admin'
    },
    {
      id: 'elec1',
      email: 'john@gmail.com',
      password: bcrypt.hashSync('elec123', 10),
      role: 'Electrician',
      name: 'John Doe'
    }
  ],
  electricians: [
    { id: '1', userId: 'elec1', name: 'John Doe', level: 'Master', status: 'Active', availability: 'Available' },
    { id: '2', name: 'Jane Smith', level: 'Journeyman', status: 'On Job', availability: 'Busy' },
  ],
  jobs: [
    { id: '1', title: 'Main Panel Replacement', location: '123 Oak St', status: 'In Progress', assignedTo: '1', deadline: '2026-04-28' },
    { id: '2', title: 'Kitchen Rewiring', location: '456 Maple Ave', status: 'Scheduled', assignedTo: '2', deadline: '2026-05-05' },
  ],
  tasks: [
    { id: '1', jobId: '1', description: 'De-energize main lines', priority: 'High', completed: true, hoursWorked: 2, electricianId: '1', date: '2026-04-26' },
    { id: '2', jobId: '1', description: 'Install new 200A panel', priority: 'High', completed: false, hoursWorked: 4, electricianId: '1', date: '2026-04-27' },
    { id: '3', jobId: '2', description: 'Run ROMEX for appliances', priority: 'Medium', completed: false, hoursWorked: 0, electricianId: '2', date: '2026-04-27' },
  ],
  materials: [
    { id: '1', name: '200A Main Breaker', quantity: 5, unit: 'pcs' },
    { id: '2', name: '12/2 ROMEX Wire', quantity: 500, unit: 'ft' },
  ],
  reports: [
    { id: '1', title: 'Weekly Progress - April Week 3', author: 'Jane Smith', date: '2026-04-21', filePath: null },
    { id: '2', title: 'Safety Inspection - Oak St', author: 'John Doe', date: '2026-04-25', filePath: null },
  ],
  uploads: [] as any[]
};

/**
 * Initialize store with persistence
 * Loads from file if exists, otherwise uses defaults
 */
function initializeStore() {
  const persistedData = loadStore();
  return persistedData || defaultStore;
}

// Load data on module initialization
export let store = initializeStore();

/**
 * Persist any changes to the store
 * Call this after any CRUD operation
 */
export function persistStore() {
  try {
    saveStore(store);
  } catch (error) {
    console.error('Failed to persist store changes:', error);
  }
}
