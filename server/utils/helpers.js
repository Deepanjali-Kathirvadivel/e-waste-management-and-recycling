const generateAssessmentCode = () => {
  const prefix = 'GRN';
  const date = new Date();
  const dateStr = date.getFullYear().toString().slice(-2) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${prefix}${dateStr}${seq}`;
};

const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { page: p, limit: l, offset: (p - 1) * l };
};

const apiResponse = (res, status, data, message = '') => {
  return res.status(status).json({
    success: status < 400,
    message,
    data
  });
};

module.exports = { generateAssessmentCode, paginate, apiResponse };
