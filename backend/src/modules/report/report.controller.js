const { Op } = require('sequelize');
const { Assessment, ProductCatalog, User, Facility, AnalysisResult, Region, InventoryItem } = require('../../models');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { generatePDF, generateExcel } = require('../../services/report.service');

exports.assessmentPDF = catchAsync(async (req, res) => {
  const { status, region_id, date_from, date_to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (region_id) where.region_id = region_id;
  if (date_from) where.created_at = { ...where.created_at, [Op.gte]: new Date(date_from) };
  if (date_to) where.created_at = { ...where.created_at, [Op.lte]: new Date(date_to + 'T23:59:59') };

  const assessments = await Assessment.findAll({
    where,
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 500,
  });

  const headers = ['ID', 'Customer', 'Product', 'Status', 'Value', 'Employee', 'Hub', 'Date'];
  const rows = assessments.map(a => [
    a.id,
    a.customer_name || '-',
    a.product_catalog?.name || a.brand || '-',
    a.status || '-',
    a.hr_approved_value || a.value_estimate || 0,
    a.user?.full_name || '-',
    a.assigned_hub?.name || '-',
    a.created_at ? new Date(a.created_at).toLocaleDateString() : '-',
  ]);

  const pdfBuffer = generatePDF('Assessments Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="assessments-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.assessmentExcel = catchAsync(async (req, res) => {
  const { status, region_id, date_from, date_to } = req.query;
  const where = {};
  if (status) where.status = status;
  if (region_id) where.region_id = region_id;
  if (date_from) where.created_at = { ...where.created_at, [Op.gte]: new Date(date_from) };
  if (date_to) where.created_at = { ...where.created_at, [Op.lte]: new Date(date_to + 'T23:59:59') };

  const assessments = await Assessment.findAll({
    where,
    include: [
      { model: ProductCatalog, attributes: ['name'] },
      { model: User, attributes: ['full_name'] },
      { model: Facility, as: 'assigned_hub', attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 500,
  });

  const headers = ['ID', 'Customer', 'Product', 'Status', 'Value', 'Employee', 'Hub', 'Date'];
  const rows = assessments.map(a => [
    a.id,
    a.customer_name || '-',
    a.product_catalog?.name || a.brand || '-',
    a.status || '-',
    a.hr_approved_value || a.value_estimate || 0,
    a.user?.full_name || '-',
    a.assigned_hub?.name || '-',
    a.created_at ? new Date(a.created_at).toLocaleDateString() : '-',
  ]);

  const buffer = await generateExcel('Assessments Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="assessments-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});

exports.sustainabilityPDF = catchAsync(async (req, res) => {
  const analysisResults = await AnalysisResult.findAll({
    include: [{ model: Assessment, include: [{ model: ProductCatalog, attributes: ['name'] }] }],
    limit: 500,
  });

  const headers = ['ID', 'Product', 'Classification', 'Recovery %', 'Est. Revenue', 'Date'];
  const rows = analysisResults.map(ar => [
    ar.id,
    ar.assessment?.product_catalog?.name || '-',
    ar.classification || '-',
    ar.recovery_potential || 0,
    ar.estimated_revenue || 0,
    ar.created_at ? new Date(ar.created_at).toLocaleDateString() : '-',
  ]);

  const pdfBuffer = generatePDF('Sustainability Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="sustainability-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.sustainabilityExcel = catchAsync(async (req, res) => {
  const analysisResults = await AnalysisResult.findAll({
    include: [{ model: Assessment, include: [{ model: ProductCatalog, attributes: ['name'] }] }],
    limit: 500,
  });

  const headers = ['ID', 'Product', 'Classification', 'Recovery %', 'Est. Revenue', 'Date'];
  const rows = analysisResults.map(ar => [
    ar.id,
    ar.assessment?.product_catalog?.name || '-',
    ar.classification || '-',
    ar.recovery_potential || 0,
    ar.estimated_revenue || 0,
    ar.created_at ? new Date(ar.created_at).toLocaleDateString() : '-',
  ]);

  const buffer = await generateExcel('Sustainability Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="sustainability-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});

exports.employeePDF = catchAsync(async (req, res) => {
  const employees = await User.findAll({
    where: { role: 'employee' },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = employees.map(e => [
    e.id, e.full_name, e.username, e.email || '-', e.phone || '-',
    e.region?.name || '-', e.facility?.name || '-', e.is_active ? 'Active' : 'Inactive',
  ]);
  const pdfBuffer = generatePDF('Employees Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="employees-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.employeeExcel = catchAsync(async (req, res) => {
  const employees = await User.findAll({
    where: { role: 'employee' },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = employees.map(e => [
    e.id, e.full_name, e.username, e.email || '-', e.phone || '-',
    e.region?.name || '-', e.facility?.name || '-', e.is_active ? 'Active' : 'Inactive',
  ]);
  const buffer = await generateExcel('Employees Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="employees-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});

exports.managerPDF = catchAsync(async (req, res) => {
  const managers = await User.findAll({
    where: { role: { [Op.in]: ['manager', 'hr'] } },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = managers.map(m => [
    m.id, m.full_name, m.username, m.email || '-', m.phone || '-',
    m.region?.name || '-', m.facility?.name || '-', m.is_active ? 'Active' : 'Inactive',
  ]);
  const pdfBuffer = generatePDF('Managers Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="managers-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.managerExcel = catchAsync(async (req, res) => {
  const managers = await User.findAll({
    where: { role: { [Op.in]: ['manager', 'hr'] } },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = managers.map(m => [
    m.id, m.full_name, m.username, m.email || '-', m.phone || '-',
    m.region?.name || '-', m.facility?.name || '-', m.is_active ? 'Active' : 'Inactive',
  ]);
  const buffer = await generateExcel('Managers Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="managers-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});

exports.supplyChainPDF = catchAsync(async (req, res) => {
  const staff = await User.findAll({
    where: { role: 'supply_chain' },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = staff.map(s => [
    s.id, s.full_name, s.username, s.email || '-', s.phone || '-',
    s.region?.name || '-', s.facility?.name || '-', s.is_active ? 'Active' : 'Inactive',
  ]);
  const pdfBuffer = generatePDF('Supply Chain Staff Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="supply-chain-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.supplyChainExcel = catchAsync(async (req, res) => {
  const staff = await User.findAll({
    where: { role: 'supply_chain' },
    attributes: { exclude: ['password_hash'] },
    include: [
      { model: Region, attributes: ['name'] },
      { model: Facility, attributes: ['name'] },
    ],
  });
  const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Region', 'Facility', 'Status'];
  const rows = staff.map(s => [
    s.id, s.full_name, s.username, s.email || '-', s.phone || '-',
    s.region?.name || '-', s.facility?.name || '-', s.is_active ? 'Active' : 'Inactive',
  ]);
  const buffer = await generateExcel('Supply Chain Staff Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="supply-chain-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});

exports.inventoryPDF = catchAsync(async (req, res) => {
  const items = await InventoryItem.findAll({
    include: [
      { model: Assessment, attributes: ['customer_name', 'deal_number'] },
      { model: Facility, attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 500,
  });
  const headers = ['ID', 'Batch', 'Customer', 'Deal #', 'Facility', 'Weight (kg)', 'Status', 'Date'];
  const rows = items.map(i => [
    i.id, i.batch_number || '-', i.assessment?.customer_name || '-',
    i.assessment?.deal_number || '-', i.facility?.name || '-', i.weight_kg || 0,
    i.stock_status || '-', i.created_at ? new Date(i.created_at).toLocaleDateString() : '-',
  ]);
  const pdfBuffer = generatePDF('Inventory Report', headers, rows);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="inventory-report.pdf"', 'Content-Length': pdfBuffer.length });
  res.send(pdfBuffer);
});

exports.inventoryExcel = catchAsync(async (req, res) => {
  const items = await InventoryItem.findAll({
    include: [
      { model: Assessment, attributes: ['customer_name', 'deal_number'] },
      { model: Facility, attributes: ['name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 500,
  });
  const headers = ['ID', 'Batch', 'Customer', 'Deal #', 'Facility', 'Weight (kg)', 'Status', 'Date'];
  const rows = items.map(i => [
    i.id, i.batch_number || '-', i.assessment?.customer_name || '-',
    i.assessment?.deal_number || '-', i.facility?.name || '-', i.weight_kg || 0,
    i.stock_status || '-', i.created_at ? new Date(i.created_at).toLocaleDateString() : '-',
  ]);
  const buffer = await generateExcel('Inventory Report', headers, rows);
  res.set({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="inventory-report.xlsx"', 'Content-Length': buffer.length });
  res.send(buffer);
});
