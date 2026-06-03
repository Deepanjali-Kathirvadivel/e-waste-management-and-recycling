const pool = require('../config/db');
const EnvironmentalImpactRepository = require('../repositories/environmentalImpactRepository');

const envRepo = new EnvironmentalImpactRepository();

class SustainabilityService {
  async getDashboard() {
    const [collectionEff] = await pool.query(`
      SELECT COALESCE((SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)) * 100, 0) as efficiency
      FROM assessments
    `);

    const [recyclingEff] = await pool.query(`
      SELECT COALESCE((COUNT(CASE WHEN classification IN ('Reusable','Repairable') THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 0) as efficiency
      FROM reusability_scores
    `);

    const [transportEff] = await pool.query(`
      SELECT COALESCE(AVG(CASE WHEN distance > 0 THEN 100 - (distance / 100) ELSE 0 END), 0) as efficiency
      FROM logistics_data
    `);

    const [facilityUtil] = await pool.query(`
      SELECT COALESCE(AVG((current_load / NULLIF(capacity, 0)) * 100), 0) as utilization
      FROM collection_centers
    `);

    const [recoveryRate] = await pool.query(`
      SELECT COALESCE((COUNT(CASE WHEN classification != 'Scrap' THEN 1 END) / NULLIF(COUNT(*), 0)) * 100, 0) as rate
      FROM reusability_scores
    `);

    const [regionScores] = await pool.query(`
      SELECT r.id, r.name,
             COALESCE((SELECT COUNT(*) FROM assessments a WHERE a.region_id = r.id), 0) as collections,
             COALESCE((SELECT AVG(rs.score) FROM reusability_scores rs JOIN assessments a ON rs.assessment_id = a.id WHERE a.region_id = r.id), 0) as avg_score,
             COALESCE((SELECT COUNT(*) FROM reusability_scores rs JOIN assessments a ON rs.assessment_id = a.id WHERE a.region_id = r.id AND rs.classification != 'Scrap'), 0) as recovered
      FROM regions r
    `);

    const [trend] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
             COALESCE(AVG(score), 0) as avg_score
      FROM reusability_scores
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    const envSummary = await envRepo.getSummary();

    const clampedTransport = Math.max(0, Math.min(100, parseFloat(transportEff[0].efficiency)));
    const clampedFacility = Math.max(0, Math.min(100, parseFloat(facilityUtil[0].utilization)));
    const clampedRecovery = Math.max(0, Math.min(100, parseFloat(recoveryRate[0].rate)));

    const score = Math.round(
      (parseFloat(collectionEff[0].efficiency) * 0.2) +
      (parseFloat(recyclingEff[0].efficiency) * 0.3) +
      (clampedTransport * 0.15) +
      (clampedFacility * 0.15) +
      (clampedRecovery * 0.2)
    );

    const regionData = regionScores.map(r => {
      const regionCollections = parseInt(r.collections) || 0;
      const regionRecovered = parseInt(r.recovered) || 0;
      const recoveryPct = regionCollections > 0 ? Math.round((regionRecovered / regionCollections) * 100) : 0;
      return {
        id: r.id,
        name: r.name,
        collections: regionCollections,
        recovered: regionRecovered,
        recovery_rate: recoveryPct,
        avg_score: Math.round(parseFloat(r.avg_score) * 100) / 100
      };
    });

    return {
      sustainabilityScore: Math.max(0, Math.min(100, score)),
      collectionEfficiency: Math.round(Math.max(0, Math.min(100, parseFloat(collectionEff[0].efficiency)))),
      recyclingEfficiency: Math.round(Math.max(0, Math.min(100, parseFloat(recyclingEff[0].efficiency)))),
      transportEfficiency: Math.round(clampedTransport),
      facilityUtilization: Math.round(clampedFacility),
      recoveryRate: Math.round(clampedRecovery),
      regionData,
      trendData: trend,
      environmental: {
        co2_saved: parseFloat(envSummary.total_co2_saved) || 0,
        energy_saved: parseFloat(envSummary.total_energy_saved) || 0,
        water_saved: parseFloat(envSummary.total_water_saved) || 0,
        landfill_diverted: parseFloat(envSummary.total_landfill_diverted) || 0,
        material_recovered: parseFloat(envSummary.total_material_recovered) || 0,
        trees_equivalent: parseInt(envSummary.total_trees_equivalent) || 0
      }
    };
  }
}

module.exports = new SustainabilityService();
