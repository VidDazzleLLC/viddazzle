import { setupDatabase, isDatabaseInitialized, resetDatabase } from '@/lib/db-setup';

/**
 * Database Setup API Endpoint
 *
 * GET /api/admin/setup-db - Check if database is initialized
 * POST /api/admin/setup-db - Initialize database tables
 * POST /api/admin/setup-db?reset=true - Reset database (drop and recreate all tables)
 *
 * This endpoint allows automated database setup without manual SQL execution.
 */
export default async function handler(req, res) {
  try {
    // GET - Check database status
    if (req.method === 'GET') {
      const initialized = await isDatabaseInitialized();
      return res.status(200).json({
        initialized,
        message: initialized
          ? 'Database is already initialized'
          : 'Database needs initialization',
      });
    }

    // POST - Setup or reset database
    if (req.method === 'POST') {
      const { reset } = req.query;

      let result;
      if (reset === 'true') {
        // Reset database (drop and recreate)
        result = await resetDatabase();
        return res.status(200).json({
          success: result.success,
          message: 'Database reset complete',
          tables: result.tables,
          errors: result.errors,
        });
      } else {
        // Normal setup (creates tables if not exist)
        result = await setupDatabase();
        return res.status(200).json({
          success: result.success,
          message: 'Database setup complete',
          tables: result.tables,
          errors: result.errors,
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to setup database',
      message: error.message,
    });
  }
}
