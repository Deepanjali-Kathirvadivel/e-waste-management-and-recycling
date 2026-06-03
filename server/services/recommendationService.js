const RecommendationRepository = require('../repositories/recommendationRepository');
const ProfitRepository = require('../repositories/profitRepository');
const NotificationRepository = require('../repositories/notificationRepository');

const recRepo = new RecommendationRepository();
const profitRepo = new ProfitRepository();
const notifRepo = new NotificationRepository();

class RecommendationService {
  async getAll() {
    return await recRepo.getWithRegion();
  }

  async getById(id) {
    const rec = await recRepo.findById(id);
    if (!rec) throw new Error('Recommendation not found');
    return rec;
  }

  async getActions(recommendationId) {
    const [rows] = await recRepo.query(
      'SELECT * FROM recommendation_actions WHERE recommendation_id = ? ORDER BY created_at DESC',
      [recommendationId]
    );
    return rows;
  }

  async createAction(recommendationId, data) {
    const rec = await recRepo.findById(recommendationId);
    if (!rec) throw new Error('Recommendation not found');

    const [result] = await recRepo.query(
      `INSERT INTO recommendation_actions (recommendation_id, action, assigned_to, due_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [recommendationId, data.action, data.assigned_to || null, data.due_date || null, data.status || 'pending']
    );
    return { id: result.insertId, ...data, recommendation_id: recommendationId };
  }

  async updateAction(actionId, data) {
    const [existing] = await recRepo.query(
      'SELECT * FROM recommendation_actions WHERE id = ?', [actionId]
    );
    if (!existing || existing.length === 0) throw new Error('Action not found');

    const fields = [];
    const params = [];
    for (const key of ['action', 'assigned_to', 'due_date', 'status']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (fields.length > 0) {
      params.push(actionId);
      await recRepo.query(
        `UPDATE recommendation_actions SET ${fields.join(', ')} WHERE id = ?`,
        params
      );
    }
    const [rows] = await recRepo.query('SELECT * FROM recommendation_actions WHERE id = ?', [actionId]);
    return rows[0];
  }

  async removeAction(actionId) {
    const [existing] = await recRepo.query(
      'SELECT * FROM recommendation_actions WHERE id = ?', [actionId]
    );
    if (!existing || existing.length === 0) throw new Error('Action not found');
    await recRepo.query('DELETE FROM recommendation_actions WHERE id = ?', [actionId]);
    return { message: 'Action deleted' };
  }

  async generate(data) {
    const profitData = await profitRepo.getLatestScenarios();
    const current = profitData.find(p => p.scenario_type === 'current');
    const currentProfit = current ? parseFloat(current.net_profit) : 0;

    const recommendations = [];
    const types = [
      { type: 'collection_center', savings: 15000, investment: 50000, roi: 30, payback: 12 },
      { type: 'preprocessing_unit', savings: 25000, investment: 75000, roi: 35, payback: 18 },
      { type: 'facility_expansion', savings: 35000, investment: 100000, roi: 40, payback: 24 },
      { type: 'route_optimization', savings: 12000, investment: 25000, roi: 45, payback: 8 },
      { type: 'staff_training', savings: 8000, investment: 15000, roi: 50, payback: 6 }
    ];

    const confidenceBase = currentProfit > 0 ? 75 : 60;

    for (const t of types) {
      const predictedProfit = currentProfit + t.savings;
      if (data.region_id || predictedProfit > currentProfit) {
        const rec = await recRepo.create({
          region_id: data.region_id || null,
          recommendation_type: t.type,
          title: this.getTitle(t.type),
          description: this.getDescription(t.type, t.savings),
          expected_savings: t.savings,
          investment_required: t.investment,
          roi: t.roi,
          payback_period: t.payback,
          confidence_score: Math.floor(Math.random() * 15) + confidenceBase,
          priority: t.savings > 20000 ? 'high' : t.savings > 10000 ? 'medium' : 'low',
          status: 'pending',
          generated_by: data.admin_id || null
        });

        if (data.admin_id) {
          await recRepo.query(
            `INSERT INTO recommendation_actions (recommendation_id, action, assigned_to, due_date, status)
             VALUES (?, ?, ?, ?, ?)`,
            [rec.id, `Review and approve ${this.getTitle(t.type)}`, data.admin_id, null, 'pending']
          );
        }

        recommendations.push(rec);
      }
    }

    if (data.admin_id) {
      await notifRepo.create({
        user_id: data.admin_id,
        user_type: 'admin',
        title: 'Recommendations Generated',
        message: `${recommendations.length} new recommendations have been generated.`,
        type: 'info',
        module: 'recommendation'
      });
    }

    return recommendations;
  }

  async updateStatus(id, status) {
    const rec = await recRepo.findById(id);
    if (!rec) throw new Error('Recommendation not found');

    const validStatuses = ['pending', 'approved', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) throw new Error('Invalid status');

    await recRepo.update(id, { status });
    return { id, status, message: `Recommendation ${status}` };
  }

  async remove(id) {
    const rec = await recRepo.findById(id);
    if (!rec) throw new Error('Recommendation not found');
    await recRepo.delete(id);
    return { message: 'Recommendation deleted' };
  }

  getTitle(type) {
    const titles = {
      'collection_center': 'Establish New Collection Center',
      'preprocessing_unit': 'Set Up Preprocessing Unit',
      'facility_expansion': 'Expand Existing Facility',
      'route_optimization': 'Optimize Collection Routes',
      'staff_training': 'Staff Training Program'
    };
    return titles[type] || 'Infrastructure Improvement';
  }

  getDescription(type, savings) {
    const descriptions = {
      'collection_center': `Expected annual savings of ₹${savings.toLocaleString()} through improved collection efficiency.`,
      'preprocessing_unit': `Expected annual savings of ₹${savings.toLocaleString()} through preprocessing automation.`,
      'facility_expansion': `Expected annual savings of ₹${savings.toLocaleString()} through expanded processing capacity.`,
      'route_optimization': `Expected annual savings of ₹${savings.toLocaleString()} through optimized logistics.`,
      'staff_training': `Expected annual savings of ₹${savings.toLocaleString()} through improved staff productivity.`
    };
    return descriptions[type] || 'Implementation of improvement measures.';
  }
}

module.exports = new RecommendationService();
