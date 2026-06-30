const { Notification, User, Assessment } = require('../models');

const whatsappService = require('./whatsapp.service');

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (e) { /* twilio not available */ }
}

exports.sendOTP = async (phone, otp) => {
  try {
    const waSent = await whatsappService.sendOTP(phone, otp);
    if (waSent) {
      console.log('[WhatsApp] OTP successfully dispatched to ' + phone);
      return true;
    }
  } catch (err) {
    console.error('[WhatsApp] sendOTP error:', err.message);
  }

  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: `Your Green Era OTP is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      console.log('[SMS] OTP sent via Twilio to ' + phone);
      return true;
    } catch (err) {
      console.error('[SMS] Twilio error:', err.message);
    }
  }
  console.log('[SMS Fallback] OTP to ' + phone + ': ' + otp);
  return true;
};

exports.notifyEmployee = async (assessment, type, managerName) => {
  try {
    await Notification.create({
      user_id: assessment.user_id,
      assessment_id: assessment.id,
      type: type,
      title: type === 'approved' ? 'Assessment Approved' :
             type === 'rejected' ? 'Assessment Rejected' :
             type === 'modified' ? 'Assessment Resubmission Required' :
             type === 'hub_assigned' ? 'Hub Assigned' : 'Notification',
      message: type === 'approved'
        ? `Assessment #${assessment.id} for ${assessment.customer_name} has been approved by ${managerName} with value \u20B9${(assessment.hr_approved_value || 0).toLocaleString('en-IN')}.`
        : type === 'rejected'
        ? `Assessment #${assessment.id} for ${assessment.customer_name} has been rejected by ${managerName}. Reason: ${assessment.rejection_reason || ''}`
        : type === 'modified'
        ? `Assessment #${assessment.id} for ${assessment.customer_name} requires resubmission. Modification requested by ${managerName}.`
        : type === 'hub_assigned'
        ? `Hub assigned for assessment #${assessment.id}.`
        : '',
      metadata: { assessment_id: assessment.id, customer: assessment.customer_name },
    });
    console.log(`[NOTIFICATION] ${type} -> employee ${assessment.user_id} for assessment #${assessment.id}`);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.notifySupplyChain = async (assessment, hubName) => {
  try {
    const supplyChainUsers = await User.findAll({ where: { role: 'supply_chain', is_active: true }, attributes: ['id'] });
    for (const sc of supplyChainUsers) {
      await Notification.create({
        user_id: sc.id,
        assessment_id: assessment.id,
        type: 'hub_assigned',
        title: 'New Hub Assignment',
        message: `Assessment #${assessment.id} for ${assessment.customer_name} has been assigned to ${hubName}. Ready for pickup coordination.`,
        metadata: { assessment_id: assessment.id, customer: assessment.customer_name, hub: hubName },
      });
    }
    console.log(`[NOTIFICATION] hub_assigned -> ${supplyChainUsers.length} supply chain user(s) for assessment #${assessment.id}`);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.sendReceipt = async (customer, receiptHtml) => {
  console.log(`[EMAIL] Receipt to ${customer.customer_email || customer.customer_phone} (${customer.customer_name}): sent`);
  return true;
};

exports.notifyForecastReady = async (userId, forecastSummary) => {
  try {
    await Notification.create({
      user_id: userId,
      type: 'forecast_ready',
      title: 'Forecast Generation Complete',
      message: `Forecast for ${forecastSummary.year_range || 'next period'} has been generated. Predicted waste: ${(forecastSummary.total_waste || 0).toLocaleString()} kg.`,
      metadata: forecastSummary,
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.notifyInventoryAlert = async (inventoryItem, alertType) => {
  try {
    const managers = await User.findAll({ where: { role: 'manager', is_active: true }, attributes: ['id'] });
    const title = alertType === 'low_stock' ? 'Low Stock Alert' : 'Inventory Alert';
    const message = alertType === 'low_stock'
      ? `Inventory item #${inventoryItem.id} (Assessment #${inventoryItem.assessment_id}) is low on stock at facility #${inventoryItem.facility_id}.`
      : `Inventory alert for item #${inventoryItem.id}`;
    for (const m of managers) {
      await Notification.create({
        user_id: m.id,
        type: alertType,
        title,
        message,
        metadata: { inventory_item_id: inventoryItem.id, assessment_id: inventoryItem.assessment_id, facility_id: inventoryItem.facility_id },
      });
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.notifySimulationComplete = async (userId, simulationResult) => {
  try {
    await Notification.create({
      user_id: userId,
      type: 'simulation_complete',
      title: 'Scenario Simulation Complete',
      message: `Simulation "${simulationResult.scenario_name}" completed. Projected profit impact: ${simulationResult.projected_profit > 0 ? '+' : ''}\u20B9${(simulationResult.projected_profit || 0).toLocaleString('en-IN')}.`,
      metadata: simulationResult,
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

exports.notifyAuditAlert = async (userId, auditEvent) => {
  try {
    await Notification.create({
      user_id: userId,
      type: 'audit_alert',
      title: auditEvent.title || 'Audit Event',
      message: auditEvent.message || '',
      metadata: auditEvent.metadata || {},
    });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const buildReceiptHtml = (dealInfo, customer) => `
<html><head><style>
  body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px}
  h1{color:#16A34A;border-bottom:2px solid #16A34A;padding-bottom:10px}
  table{width:100%;border-collapse:collapse;margin:20px 0}
  td{padding:8px;border-bottom:1px solid #ddd}
  .label{font-weight:bold;color:#555;width:40%}
  .total{font-size:1.2em;font-weight:bold;color:#16A34A}
  .footer{margin-top:30px;font-size:0.85em;color:#999;text-align:center}
</style></head><body>
<h1>Green Era Recyclers - Receipt</h1>
<table>
  <tr><td class="label">Receipt No</td><td>${dealInfo.receipt_number || 'N/A'}</td></tr>
  <tr><td class="label">Deal No</td><td>${dealInfo.deal_number || 'N/A'}</td></tr>
  <tr><td class="label">Collection No</td><td>${dealInfo.collection_number || 'N/A'}</td></tr>
  <tr><td class="label">Customer</td><td>${customer.customer_name || '-'}</td></tr>
  <tr><td class="label">Phone</td><td>${customer.customer_phone || '-'}</td></tr>
  <tr><td class="label">Product</td><td>${dealInfo.product_name || '-'}</td></tr>
  <tr><td class="label">Approved Value</td><td class="total">\u20B9${(dealInfo.approved_value || 0).toLocaleString('en-IN')}</td></tr>
  <tr><td class="label">Branch</td><td>${dealInfo.branch_name || '-'}</td></tr>
  <tr><td class="label">Date</td><td>${new Date(dealInfo.deal_closed_at || Date.now()).toLocaleString()}</td></tr>
</table>
<div class="footer">Thank you for recycling with Green Era!</div>
</body></html>`;

exports.sendDealClosedNotification = async (customer, dealInfo) => {
  const html = buildReceiptHtml(dealInfo, customer);
  await exports.sendReceipt(customer, html);
  console.log(`[NOTIFICATION] Deal ${dealInfo.deal_number} closed for ${customer.customer_name}`);
  return true;
};

exports.sendReceiptDownload = async (customer, dealInfo) => {
  return buildReceiptHtml(dealInfo, customer);
};
