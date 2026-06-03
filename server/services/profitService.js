const ProfitRepository = require('../repositories/profitRepository');
const LogisticsRepository = require('../repositories/logisticsRepository');
const pool = require('../config/db');

const profitRepo = new ProfitRepository();
const logisticsRepo = new LogisticsRepository();

class ProfitService {
  async simulate(scenario) {
    const baseRevenue = parseFloat(scenario.revenue) || 100000;
    const transportCost = parseFloat(scenario.transportation_cost) || 20000;
    const facilityCost = parseFloat(scenario.facility_cost) || 15000;
    const laborCost = parseFloat(scenario.labor_cost) || 25000;
    const operationalCost = parseFloat(scenario.operational_cost) || 10000;
    const totalCost = transportCost + facilityCost + laborCost + operationalCost;
    const netProfit = baseRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    const investmentRequired = parseFloat(scenario.investment_required) || 0;
    let paybackPeriod = 0;
    if (netProfit > 0 && investmentRequired > 0) {
      const monthlyProfit = netProfit / 12;
      paybackPeriod = monthlyProfit > 0 ? Math.ceil(investmentRequired / monthlyProfit) : 0;
    } else if (netProfit > 0) {
      paybackPeriod = 12;
    }

    const result = {
      scenario_name: scenario.scenario_name || 'Current Infrastructure',
      scenario_type: scenario.scenario_type || 'current',
      revenue: baseRevenue,
      transportation_cost: transportCost,
      facility_cost: facilityCost,
      labor_cost: laborCost,
      operational_cost: operationalCost,
      total_cost: totalCost,
      net_profit: netProfit,
      roi: Math.round(roi * 100) / 100,
      payback_period: paybackPeriod,
      investment_required: investmentRequired,
      region_id: scenario.region_id || null
    };

    const saved = await profitRepo.create(result);

    result.roiDisplay = `${result.roi}%`;
    result.paybackDisplay = result.payback_period > 0 ? `${result.payback_period} months` : 'N/A';
    result.id = saved.id;
    return result;
  }

  async simulateAllScenarios() {
    const scenarios = [
      { scenario_name: 'Current Infrastructure', scenario_type: 'current', revenue: 100000, transportation_cost: 20000, facility_cost: 15000, labor_cost: 25000, operational_cost: 10000 },
      { scenario_name: 'New Collection Center', scenario_type: 'new_center', revenue: 150000, transportation_cost: 25000, facility_cost: 35000, labor_cost: 35000, operational_cost: 15000, investment_required: 50000 },
      { scenario_name: 'New Preprocessing Unit', scenario_type: 'new_unit', revenue: 180000, transportation_cost: 22000, facility_cost: 45000, labor_cost: 30000, operational_cost: 18000, investment_required: 75000 },
      { scenario_name: 'Facility Expansion', scenario_type: 'expansion', revenue: 200000, transportation_cost: 28000, facility_cost: 25000, labor_cost: 40000, operational_cost: 20000, investment_required: 100000 },
      { scenario_name: 'Route Optimization', scenario_type: 'route_optimization', revenue: 120000, transportation_cost: 12000, facility_cost: 15000, labor_cost: 25000, operational_cost: 10000, investment_required: 25000 }
    ];

    const results = [];
    for (const s of scenarios) {
      results.push(await this.simulate(s));
    }
    return results;
  }

  async getDashboard() {
    const scenarios = await profitRepo.getComparison();
    if (!scenarios || scenarios.length === 0) {
      return {
        currentProfit: 0, currentCost: 0, predictedProfit: 0, savings: 0,
        bestROI: 0, bestPayback: 0, scenarios: []
      };
    }
    const current = scenarios.find(s => s.scenario_type === 'current');
    const best = scenarios.reduce((max, s) =>
      parseFloat(s.net_profit) > parseFloat(max.net_profit) ? s : max,
      scenarios[0]
    );

    return {
      currentProfit: current ? parseFloat(current.net_profit) : 0,
      currentCost: current ? parseFloat(current.total_cost) : 0,
      predictedProfit: best ? parseFloat(best.net_profit) : 0,
      savings: best && current ? parseFloat(best.net_profit) - parseFloat(current.net_profit) : 0,
      bestROI: best ? parseFloat(best.roi) : 0,
      bestPayback: best ? parseFloat(best.payback_period) : 0,
      scenarios
    };
  }

  async getComparison() {
    return await profitRepo.getComparison();
  }
}

module.exports = new ProfitService();
