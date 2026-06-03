const ScenarioSimulationRepository = require('../repositories/scenarioSimulationRepository');
const ProfitRepository = require('../repositories/profitRepository');

const simRepo = new ScenarioSimulationRepository();
const profitRepo = new ProfitRepository();

class ScenarioSimulationService {
  async getAll() {
    return await simRepo.getWithRegion();
  }

  async getById(id) {
    const sim = await simRepo.findById(id);
    if (!sim) throw new Error('Simulation not found');
    return sim;
  }

  async create(data) {
    const baselineScenarios = await profitRepo.getComparison();
    const baseline = baselineScenarios.find(s => s.scenario_type === 'current');
    const baselineProfit = baseline ? parseFloat(baseline.net_profit) : 0;

    const simulatedRevenue = parseFloat(data.parameters?.revenue_modifier || 1) * baselineProfit;
    const simulatedCost = parseFloat(data.parameters?.cost_modifier || 1) * (baseline ? parseFloat(baseline.total_cost) : 0);
    const simulatedProfit = simulatedRevenue - simulatedCost;
    const delta = simulatedProfit - baselineProfit;
    const deltaPercentage = baselineProfit > 0 ? (delta / baselineProfit) * 100 : 0;

    const sim = await simRepo.create({
      name: data.name,
      type: data.type || 'what_if',
      parameters: data.parameters ? JSON.stringify(data.parameters) : null,
      baseline_net_profit: baselineProfit,
      simulated_net_profit: Math.round(simulatedProfit * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      delta_percentage: Math.round(deltaPercentage * 100) / 100,
      confidence: data.confidence || Math.floor(Math.random() * 20) + 70,
      status: 'completed',
      region_id: data.region_id || null,
      created_by: data.created_by || null
    });

    return sim;
  }

  async update(id, data) {
    const sim = await simRepo.findById(id);
    if (!sim) throw new Error('Simulation not found');
    await simRepo.update(id, data);
    return await simRepo.findById(id);
  }

  async remove(id) {
    const sim = await simRepo.findById(id);
    if (!sim) throw new Error('Simulation not found');
    await simRepo.delete(id);
    return { message: 'Simulation deleted' };
  }

  async getStats() {
    return await simRepo.getStats();
  }
}

module.exports = new ScenarioSimulationService();
