const EnvironmentalImpactRepository = require('../repositories/environmentalImpactRepository');
const pool = require('../config/db');

const envRepo = new EnvironmentalImpactRepository();

class EnvironmentalImpactService {
  async getDashboard() {
    const summary = await envRepo.getSummary();
    const latest = await envRepo.getLatest();
    const trend = await envRepo.getTrend();

    const totalRecovered = parseFloat(summary.total_material_recovered) || 0;

    return {
      ...summary,
      co2_saved: parseFloat(summary.total_co2_saved) || 0,
      energy_saved: parseFloat(summary.total_energy_saved) || 0,
      water_saved: parseFloat(summary.total_water_saved) || 0,
      landfill_diverted: parseFloat(summary.total_landfill_diverted) || 0,
      material_recovered: totalRecovered,
      trees_equivalent: parseInt(summary.total_trees_equivalent) || 0,
      households_equivalent: latest ? (latest.households_equivalent || 0) : 0,
      latest_recorded: latest ? latest.recorded_at : null,
      trend
    };
  }

  async getByRegion(regionId) {
    const latest = await envRepo.getLatest(regionId);
    const trend = await envRepo.getTrend(regionId);
    return { latest, trend };
  }

  async record(data) {
    const treesEquivalent = Math.floor(parseFloat(data.co2_saved || 0) / 21.7);
    const householdsEquivalent = Math.floor(parseFloat(data.energy_saved || 0) / 4.5);

    return await envRepo.create({
      region_id: data.region_id || null,
      co2_saved: data.co2_saved || 0,
      energy_saved: data.energy_saved || 0,
      water_saved: data.water_saved || 0,
      landfill_diverted: data.landfill_diverted || 0,
      material_recovered: data.material_recovered || 0,
      trees_equivalent: treesEquivalent,
      households_equivalent: householdsEquivalent
    });
  }
}

module.exports = new EnvironmentalImpactService();
