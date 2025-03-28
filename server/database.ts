import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure required environment variables are present
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please create a database first.');
}

// Connection string for migrations (uses a different pool with higher timeout)
export const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

// Connection pool for the application
export const queryClient = postgres(process.env.DATABASE_URL, { max: 10 });

// Initialize the drizzle db instance
export const db = drizzle(queryClient, { schema });

// Run migrations
export const runMigrations = async () => {
  try {
    console.log('Running database migrations...');
    const startTime = Date.now();
    
    // Create a drizzle instance with the migrationClient
    const migrationDb = drizzle(migrationClient);
    
    // Run the migrations
    await migrate(migrationDb, { migrationsFolder: 'migrations' });
    
    console.log(`Migrations completed in ${Date.now() - startTime}ms`);
  } catch (error: unknown) {
    // PostgreSQL error has a 'code' property
    type PostgresError = { code: string };
    
    // Check if error is about tables already existing (code 42P07)
    const pgError = error as PostgresError;
    if (pgError && typeof pgError === 'object' && 'code' in pgError && pgError.code === '42P07') {
      console.log('Tables already exist, skipping migrations');
      return; // Continue with application startup
    }
    
    console.error('Migration failed:', error);
    throw error;
  }
};