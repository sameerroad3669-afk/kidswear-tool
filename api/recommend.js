// api/recommend.js - Vercel Serverless Function
// This runs as a backend API - no server needed!

const sizeCharts = require('../data/sizecharts.json');

// ============================================
// CORS Handler
// ============================================
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Brand-ID');
  res.setHeader('Content-Type', 'application/json');
}

// ============================================
// SIZE SCORING ENGINE
// ============================================
function rangeScore(value, min, max) {
  if (!value || !min || !max) return 0;
  const range = max - min || 1;
  const mid = (min + max) / 2;

  if (value >= min && value <= max) {
    const distFromCenter = Math.abs(value - mid);
    return 1 - (distFromCenter / (range / 2)) * 0.3;
  }

  const distOutside = value < min ? min - value : value - max;
  return Math.max(0, 0.7 - (distOutside / range) * 0.5);
}

function recommendSize(input) {
  const {
    ageYears = null,
    ageMonths: extraMonths = null,
    height = null,
    weight = null,
    gender = 'unisex',
    fitPreference = 'regular',
    growthBuffer = false,
    category = 'tops',
    brand = 'default'
  } = input;

  // Get chart
  const brandChart = sizeCharts.charts[brand] || sizeCharts.charts['default'];
  const categoryChart = brandChart.sizes[category];

  if (!categoryChart) {
    return { error: true, message: `Category not found: ${category}` };
  }

  // Validate - need at least one input
  const hasAge = ageYears !== null || extraMonths !== null;
  const hasHeight = height !== null && height > 0;
  const hasWeight = weight !== null && weight > 0;

  if (!hasAge && !hasHeight && !hasWeight) {
    return { error: true, message: 'Please provide at least age, height, or weight' };
  }

  // Calculate total age in months
  const totalAgeMonths = ((ageYears || 0) * 12) + (extraMonths || 0);

  // Score all sizes
  const sizeKeys = Object.keys(categoryChart);
  const scores = sizeKeys.map(key => {
    const s = categoryChart[key];
    let total = 0;
    let factors = 0;

    // Age contributes 30%
    if (hasAge && s.ageMonths) {
      total += rangeScore(totalAgeMonths, s.ageMonths[0], s.ageMonths[1]) * 0.3;
      factors += 0.3;
    }

    // Height contributes 40% (most important)
    if (hasHeight && s.height) {
      total += rangeScore(height, s.height[0], s.height[1]) * 0.4;
      factors += 0.4;
    }

    // Weight contributes 30%
    if (hasWeight && s.weight) {
      total += rangeScore(weight, s.weight[0], s.weight[1]) * 0.3;
      factors += 0.3;
    }

    // Normalize score
    if (factors > 0 && factors < 1) {
      total = total / factors;
    }

    // Apply fit preference
    const idx = sizeKeys.indexOf(key);
    if (fitPreference === 'slim' && idx > 0) total -= 0.04;
    if (fitPreference === 'loose' && idx < sizeKeys.length - 1) total += 0.04;

    return {
      size: key,
      label: s.label,
      displaySize: s.displaySize,
      score: Math.round(total * 1000) / 1000,
      data: s
    };
  });

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  let primary = { ...scores[0] };
  let growthApplied = false;

  // Apply growth buffer - go one size up
  if (growthBuffer) {
    const currentIdx = sizeKeys.indexOf(primary.size);
    if (currentIdx < sizeKeys.length - 1) {
      const nextKey = sizeKeys[currentIdx + 1];
      const nextSize = scores.find(s => s.size === nextKey);
      if (nextSize) {
        primary = { ...nextSize, originalSize: scores[0].size };
        growthApplied = true;
      }
    }
  }

  // Calculate confidence
  const inputCount = (hasAge ? 1 : 0) + (hasHeight ? 1 : 0) + (hasWeight ? 1 : 0);
  let baseConfidence = 60 + (inputCount * 10);

  if (primary.score > 0.85) baseConfidence = Math.min(98, baseConfidence + 20);
  else if (primary.score > 0.70) baseConfidence = Math.min(92, baseConfidence + 12);
  else if (primary.score > 0.55) baseConfidence = Math.min(82, baseConfidence + 5);
  else baseConfidence = Math.max(50, baseConfidence - 10);

  // Determine labels
  let confidenceLabel, fitDescription;

  if (primary.score > 0.85) confidenceLabel = '🎯 Best Fit';
  else if (primary.score > 0.70) confidenceLabel = '✅ Good Fit';
  else if (primary.score > 0.55) confidenceLabel = '👍 Reasonable Fit';
  else confidenceLabel = '⚠️ Approximate Fit';

  if (growthApplied) fitDescription = '🌱 Room to Grow (3-6 months)';
  else if (fitPreference === 'slim') fitDescription = '🤏 Snug / Slim Fit';
  else if (fitPreference === 'loose') fitDescription = '🤗 Comfortable Loose Fit';
  else if (primary.score > 0.85) fitDescription = '✨ Perfect Fit';
  else fitDescription = '👌 Good Fit';

  // Build suggestions
  const suggestions = [];
  const primaryIdx = sizeKeys.indexOf(primary.size);

  if (!growthBuffer && primaryIdx < sizeKeys.length - 1) {
    const nextKey = sizeKeys[primaryIdx + 1];
    suggestions.push({
      type: 'growth',
      icon: '🌱',
      text: `For 3-6 months longer use, consider size ${categoryChart[nextKey].label}`,
      size: nextKey
    });
  }

  if (fitPreference === 'regular' && primaryIdx > 0) {
    const prevKey = sizeKeys[primaryIdx - 1];
    suggestions.push({
      type: 'slim',
      icon: '✂️',
      text: `For a slimmer fit, size ${categoryChart[prevKey].label} may work`,
      size: prevKey
    });
  }

  // Alternative sizes (top 2 excluding primary)
  const alternatives = scores
    .filter(s => s.size !== primary.size)
    .slice(0, 2)
    .map(s => ({ size: s.size, label: s.label, score: s.score }));

  return {
    error: false,
    recommendation: {
      size: primary.size,
      displaySize: primary.displaySize,
      label: primary.label,
      score: primary.score,
      fitDescription,
      confidenceLabel,
      confidence: {
        level: primary.score > 0.85 ? 'excellent' : primary.score > 0.70 ? 'good' : 'moderate',
        percentage: baseConfidence
      },
      growthApplied,
      originalSize: primary.originalSize || null,
      measurements: {
        height: primary.data?.height,
        weight: primary.data?.weight,
        chest: primary.data?.chest,
        waist: primary.data?.waist
      }
    },
    suggestions,
    alternatives,
    meta: {
      brand,
      category,
      inputsUsed: { age: hasAge, height: hasHeight, weight: hasWeight },
      timestamp: new Date().toISOString()
    }
  };
}

// ============================================
// MAIN HANDLER
// ============================================
module.exports = async function handler(req, res) {
  setCors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Health check / info
    return res.status(200).json({
      status: 'live',
      service: 'Kidswear Size Recommendation API',
      version: '2.0.0',
      endpoints: {
        recommend: 'POST /api/recommend',
        charts: 'GET /api/recommend?action=charts'
      }
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const result = recommendSize(body);

      if (result.error) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({
        error: true,
        message: 'Something went wrong. Please try again.'
      });
    }
  }

  return res.status(405).json({ error: true, message: 'Method not allowed' });
};
