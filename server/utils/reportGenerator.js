const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class ReportGenerator {
  async generateExcel(data, type) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(type.replace('_', ' '));

    let rows;
    switch (type) {
      case 'collection': rows = this.formatCollectionData(data); break;
      case 'forecast': rows = this.formatForecastData(data); break;
      case 'reusability': rows = this.formatReusabilityData(data); break;
      case 'profitability': rows = this.formatProfitabilityData(data); break;
      case 'sustainability': rows = this.formatSustainabilityData(data); break;
      case 'staff_performance': rows = this.formatStaffPerformanceData(data); break;
      default: throw new Error('Invalid report type');
    }

    sheet.addRows(rows);

    const fileName = `${type}_report_${Date.now()}.xlsx`;
    const filePath = path.join(config.report.path, fileName);

    if (!fs.existsSync(config.report.path)) {
      fs.mkdirSync(config.report.path, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);
    return { filePath, fileName, format: 'excel' };
  }

  async generatePdf(data, type) {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const fileName = `${type}_report_${Date.now()}.pdf`;
    const filePath = path.join(config.report.path, fileName);

    if (!fs.existsSync(config.report.path)) {
      fs.mkdirSync(config.report.path, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(18).font('Helvetica-Bold').text('GreenEra E-Waste Management', { align: 'center' });
    doc.fontSize(14).text(`${type.replace('_', ' ').toUpperCase()} Report`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    this.buildPdfContent(doc, data, type);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve({ filePath, fileName, format: 'pdf' }));
      stream.on('error', reject);
    });
  }

  buildPdfContent(doc, data, type) {
    switch (type) {
      case 'collection':
        this.pdfCollection(doc, data);
        break;
      case 'forecast':
        this.pdfForecast(doc, data);
        break;
      case 'reusability':
        this.pdfReusability(doc, data);
        break;
      case 'profitability':
        this.pdfProfitability(doc, data);
        break;
      case 'sustainability':
        this.pdfSustainability(doc, data);
        break;
      case 'staff_performance':
        this.pdfStaffPerformance(doc, data);
        break;
      default:
        doc.text('No data available for this report type.');
    }
  }

  pdfCollection(doc, data) {
    doc.fontSize(12).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Assessments: ${data.total || 0}`);
    doc.text(`Completed: ${data.completed || 0}`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Recent Assessments', { underline: true });
    doc.moveDown();
    const recent = data.recent || [];
    recent.forEach(item => {
      doc.fontSize(9).font('Helvetica').text(
        `${item.assessment_code} | ${item.customer} | ${item.product} | ${item.status} | ${item.created_at}`
      );
    });
  }

  pdfForecast(doc, data) {
    const results = data.results || [];
    results.forEach(item => {
      doc.fontSize(11).font('Helvetica-Bold').text(`${item.region_name} - ${item.target_year}`);
      doc.fontSize(9).font('Helvetica');
      doc.text(`1yr Prediction: ${item.prediction_1yr}`);
      doc.text(`3yr Prediction: ${item.prediction_3yr}`);
      doc.text(`5yr Prediction: ${item.prediction_5yr}`);
      doc.text(`Growth Rate: ${item.growth_rate}%`);
      doc.text(`Confidence: ${item.confidence_interval}%`);
      doc.moveDown(0.5);
    });
  }

  pdfReusability(doc, data) {
    const summary = data.summary || [];
    summary.forEach(item => {
      doc.fontSize(10).font('Helvetica');
      doc.text(`${item.classification}: ${item.count} items, Avg Score: ${item.avg_score}, Total Value: ${item.total_value}`);
    });
  }

  pdfProfitability(doc, data) {
    const scenarios = data.scenarios || [];
    scenarios.forEach(item => {
      doc.fontSize(11).font('Helvetica-Bold').text(item.scenario_name);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Revenue: ${item.revenue}`);
      doc.text(`Total Cost: ${item.total_cost}`);
      doc.text(`Net Profit: ${item.net_profit}`);
      doc.text(`ROI: ${item.roi}%`);
      doc.text(`Payback: ${item.payback_period} months`);
      doc.moveDown(0.5);
    });
  }

  pdfSustainability(doc, data) {
    const regions = data.regions || [];
    doc.fontSize(10).font('Helvetica');
    regions.forEach(item => {
      doc.text(`${item.name}: ${item.collections} collections, Value: ${item.value}`);
    });
  }

  pdfStaffPerformance(doc, data) {
    const staff = data.staff || [];
    staff.forEach(item => {
      doc.fontSize(9).font('Helvetica');
      doc.text(`${item.full_name} (${item.role}) - ${item.region}: ${item.total_assessments} assessments, ${item.completed} completed, Value: ${item.total_value}`);
    });
  }

  formatCollectionData(data) {
    const rows = [['Assessment Code', 'Customer', 'Product', 'Status', 'Date']];
    (data.recent || []).forEach(item => {
      rows.push([item.assessment_code, item.customer, item.product, item.status, item.created_at]);
    });
    rows.push([], ['Summary'], ['Total', data.total], ['Completed', data.completed]);
    return rows;
  }

  formatForecastData(data) {
    const rows = [['Region', 'Target Year', '1yr Prediction', '3yr Prediction', '5yr Prediction', 'Growth Rate', 'Confidence']];
    (data.results || []).forEach(item => {
      rows.push([item.region_name, item.target_year, item.prediction_1yr, item.prediction_3yr, item.prediction_5yr, item.growth_rate, item.confidence_interval]);
    });
    return rows;
  }

  formatReusabilityData(data) {
    const rows = [['Classification', 'Count', 'Avg Score', 'Total Value']];
    (data.summary || []).forEach(item => {
      rows.push([item.classification, item.count, item.avg_score, item.total_value]);
    });
    return rows;
  }

  formatProfitabilityData(data) {
    const rows = [['Scenario', 'Revenue', 'Total Cost', 'Net Profit', 'ROI', 'Payback']];
    (data.scenarios || []).forEach(item => {
      rows.push([item.scenario_name, item.revenue, item.total_cost, item.net_profit, item.roi, item.payback_period]);
    });
    return rows;
  }

  formatSustainabilityData(data) {
    const rows = [['Region', 'Collections', 'Value']];
    (data.regions || []).forEach(item => {
      rows.push([item.name, item.collections, item.value]);
    });
    return rows;
  }

  formatStaffPerformanceData(data) {
    const rows = [['Name', 'Role', 'Region', 'Total Assessments', 'Completed', 'Total Value']];
    (data.staff || []).forEach(item => {
      rows.push([item.full_name, item.role, item.region, item.total_assessments, item.completed, item.total_value]);
    });
    return rows;
  }
}

module.exports = ReportGenerator;
