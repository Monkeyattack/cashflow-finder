import { Router } from 'express';
import { dataImportService } from '../services/dataImportService';
import { authenticateUser, requirePermission } from '../middleware/auth';

const router = Router();

// POST /api/admin/import - Trigger data import
router.post('/import', 
  authenticateUser,
  requirePermission('admin:data_import'),
  async (req, res) => {
    try {
      const { source, filters } = req.body;
      
      if (!source) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SOURCE',
            message: 'Data source is required'
          }
        });
      }
      
      console.log(`Starting data import from ${source}...`);
      const results = await dataImportService.bulkImport(source, filters);
      
      res.json({
        success: true,
        data: {
          source,
          results,
          message: `Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors} errors`
        }
      });
      
    } catch (error: any) {
      console.error('Import API error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'IMPORT_FAILED',
          message: error.message || 'Data import failed'
        }
      });
    }
  }
);

// POST /api/admin/refresh - Refresh existing listings
router.post('/refresh',
  authenticateUser,
  requirePermission('admin:data_refresh'),
  async (req, res) => {
    try {
      const { maxAge } = req.body;
      
      await dataImportService.refreshListings(maxAge || 7);
      
      res.json({
        success: true,
        data: {
          message: 'Listing refresh initiated'
        }
      });
      
    } catch (error: any) {
      console.error('Refresh API error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: error.message || 'Data refresh failed'
        }
      });
    }
  }
);

// GET /api/admin/import-status - Get import statistics
router.get('/import-status',
  authenticateUser,
  requirePermission('admin:view_stats'),
  async (req, res) => {
    try {
      // This would query database for import statistics
      res.json({
        success: true,
        data: {
          total_listings: 0,
          sources: [],
          last_import: null,
          quality_stats: {
            avg_quality_score: 0,
            avg_risk_score: 0
          }
        }
      });
      
    } catch (error: any) {
      console.error('Import status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_FETCH_FAILED',
          message: 'Failed to fetch import status'
        }
      });
    }
  }
);

export { router as adminRoutes };