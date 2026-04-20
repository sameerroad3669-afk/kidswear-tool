// api/charts.js - Returns size chart data
const sizeCharts = require('../data/sizecharts.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const brand = req.query.brand || 'default';
  const category = req.query.category || 'tops';

  const brandChart = sizeCharts.charts[brand] || sizeCharts.charts['default'];
  const categoryData = brandChart?.sizes[category] || {};

  return res.status(200).json({
    brand,
    category,
    brandName: brandChart?.brandName,
    sizes: categoryData,
    lastUpdated: sizeCharts.lastUpdated
  });
};
