const router = require('express').Router();
const { auth, rbac } = require('../../middleware/auth');
const ctrl = require('./report.controller');
const biCtrl = require('../../controllers/bi.controller');

router.get('/assessments/pdf', auth, rbac('admin', 'root', 'manager'), ctrl.assessmentPDF);
router.get('/assessments/excel', auth, rbac('admin', 'root', 'manager'), ctrl.assessmentExcel);
router.get('/sustainability/pdf', auth, rbac('admin', 'root'), ctrl.sustainabilityPDF);
router.get('/sustainability/excel', auth, rbac('admin', 'root'), ctrl.sustainabilityExcel);
router.get('/employees/pdf', auth, rbac('admin', 'root'), ctrl.employeePDF);
router.get('/employees/excel', auth, rbac('admin', 'root'), ctrl.employeeExcel);
router.get('/managers/pdf', auth, rbac('admin', 'root'), ctrl.managerPDF);
router.get('/managers/excel', auth, rbac('admin', 'root'), ctrl.managerExcel);
router.get('/supply-chain/pdf', auth, rbac('admin', 'root'), ctrl.supplyChainPDF);
router.get('/supply-chain/excel', auth, rbac('admin', 'root'), ctrl.supplyChainExcel);
router.get('/inventory/pdf', auth, rbac('admin', 'root', 'center_manager', 'supply_chain'), ctrl.inventoryPDF);
router.get('/inventory/excel', auth, rbac('admin', 'root', 'center_manager', 'supply_chain'), ctrl.inventoryExcel);

module.exports = { route: '/reports', router };
