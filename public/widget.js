(function () {
  'use strict';

  const cfg = window.KidsSizeToolConfig || {};
  const PRIMARY = cfg.primaryColor || '#6C63FF';
  const ACCENT = cfg.accentColor || '#FF6584';
  const CONTAINER_ID = cfg.containerId || 'kidswear-size-tool';
  const SHOP_URL = cfg.shopUrl || '';

  const SIZE_CHARTS = {
    tops: {
      "0-3M": { label: "0-3 Months", ageMonths: [0,3], height: [50,62], weight: [3,6] },
      "3-6M": { label: "3-6 Months", ageMonths: [3,6], height: [62,68], weight: [6,8] },
      "6-12M": { label: "6-12 Months", ageMonths: [6,12], height: [68,76], weight: [8,10] },
      "1-2Y": { label: "1-2 Years", ageMonths: [12,24], height: [76,90], weight: [10,13] },
      "2-3Y": { label: "2-3 Years", ageMonths: [24,36], height: [90,98], weight: [13,15] },
      "3-4Y": { label: "3-4 Years", ageMonths: [36,48], height: [98,104], weight: [15,17] },
      "4-5Y": { label: "4-5 Years", ageMonths: [48,60], height: [104,110], weight: [17,20] },
      "5-6Y": { label: "5-6 Years", ageMonths: [60,72], height: [110,116], weight: [20,22] },
      "6-7Y": { label: "6-7 Years", ageMonths: [72,84], height: [116,122], weight: [22,25] },
      "7-8Y": { label: "7-8 Years", ageMonths: [84,96], height: [122,128], weight: [25,28] },
      "8-10Y": { label: "8-10 Years", ageMonths: [96,120], height: [128,140], weight: [28,35] },
      "10-12Y": { label: "10-12 Years", ageMonths: [120,144], height: [140,152], weight: [35,45] },
      "12-14Y": { label: "12-14 Years", ageMonths: [144,168], height: [152,164], weight: [45,55] }
    },
    bottoms: {
      "0-3M": { label: "0-3 Months", ageMonths: [0,3], height: [50,62], weight: [3,6] },
      "3-6M": { label: "3-6 Months", ageMonths: [3,6], height: [62,68], weight: [6,8] },
      "6-12M": { label: "6-12 Months", ageMonths: [6,12], height: [68,76], weight: [8,10] },
      "1-2Y": { label: "1-2 Years", ageMonths: [12,24], height: [76,90], weight: [10,13] },
      "2-3Y": { label: "2-3 Years", ageMonths: [24,36], height: [90,98], weight: [13,15] },
      "3-4Y": { label: "3-4 Years", ageMonths: [36,48], height: [98,104], weight: [15,17] },
      "4-5Y": { label: "4-5 Years", ageMonths: [48,60], height: [104,110], weight: [17,20] },
      "5-6Y": { label: "5-6 Years", ageMonths: [60,72], height: [110,116], weight: [20,22] },
      "6-7Y": { label: "6-7 Years", ageMonths: [72,84], height: [116,122], weight: [22,25] },
      "7-8Y": { label: "7-8 Years", ageMonths: [84,96], height: [122,128], weight: [25,28] },
      "8-10Y": { label: "8-10 Years", ageMonths: [96,120], height: [128,140], weight: [28,35] },
      "10-12Y": { label: "10-12 Years", ageMonths: [120,144], height: [140,152], weight: [35,45] },
      "12-14Y": { label: "12-14 Years", ageMonths: [144,168], height: [152,164], weight: [45,55] }
    }
  };

  function rangeScore(value, min, max) {
    if (!value || min === undefined || max === undefined) return 0;
    const range = max - min || 1;
    const mid = (min + max) / 2;
    if (value >= min && value <= max) {
      return 1 - (Math.abs(value - mid) / (range / 2)) * 0.3;
    }
    const dist = value < min ? min - value : value - max;
    return Math.max(0, 0.7 - (dist / range) * 0.5);
  }

  function recommend(inputs) {
    const { ageYears, height, weight, fit, growth, cat } = inputs;
    const chart = SIZE_CHARTS[cat] || SIZE_CHARTS.tops;
    const keys = Object.keys(chart);

    const hasAge = ageYears !== '' && ageYears !== null && ageYears !== undefined;
    const hasHeight = height && Number(height) > 0;
    const hasWeight = weight && Number(weight) > 0;

    const ageMonths = hasAge ? Number(ageYears) * 12 : null;
    const h = hasHeight ? Number(height) : null;
    const w = hasWeight ? Number(weight) : null;

    const scored = keys.map(k => {
      const s = chart[k];
      let total = 0, factors = 0;

      if (hasAge && s.ageMonths) {
        total += rangeScore(ageMonths, s.ageMonths[0], s.ageMonths[1]) * 0.3;
        factors += 0.3;
      }
      if (hasHeight && s.height) {
        total += rangeScore(h, s.height[0], s.height[1]) * 0.4;
        factors += 0.4;
      }
      if (hasWeight && s.weight) {
        total += rangeScore(w, s.weight[0], s.weight[1]) * 0.3;
        factors += 0.3;
      }

      if (factors > 0 && factors < 1) total = total / factors;

      const idx = keys.indexOf(k);
      if (fit === 'slim' && idx > 0) total -= 0.04;
      if (fit === 'loose' && idx < keys.length - 1) total += 0.04;

      return { k, label: s.label, score: Math.round(total * 1000) / 1000, data: s };
    });

    scored.sort((a, b) => b.score - a.score);

    let primary = { ...scored[0] };
    let growthApplied = false;

    if (growth) {
      const ci = keys.indexOf(primary.k);
      if (ci < keys.length - 1) {
        const nextKey = keys[ci + 1];
        const next = scored.find(s => s.k === nextKey);
        if (next) { primary = { ...next }; growthApplied = true; }
      }
    }

    const inputCount = (hasAge ? 1 : 0) + (hasHeight ? 1 : 0) + (hasWeight ? 1 : 0);
    let confPct = 55 + (inputCount * 12);
    if (primary.score > 0.85) confPct = Math.min(98, confPct + 20);
    else if (primary.score > 0.70) confPct = Math.min(92, confPct + 12);
    else if (primary.score > 0.55) confPct = Math.min(82, confPct + 5);
    else confPct = Math.max(50, confPct - 5);

    const confLabel = primary.score > 0.85 ? '🎯 Best Fit' :
      primary.score > 0.70 ? '✅ Good Fit' : '👍 Reasonable Fit';

    const fitDesc = growthApplied ? '🌱 Room to Grow' :
      fit === 'slim' ? '🤏 Snug Fit' :
      fit === 'loose' ? '🤗 Loose Fit' : '✨ Perfect Fit';

    const suggestions = [];
    const pi = keys.indexOf(primary.k);
    if (!growth && pi < keys.length - 1) {
      suggestions.push('💡 For 3-6 months longer wear, consider size ' + chart[keys[pi + 1]].label);
    }

    return {
      size: primary.k,
      label: primary.label,
      conf: confPct,
      confLabel,
      fitDesc,
      growthApplied,
      height: primary.data?.height,
      weight: primary.data?.weight,
      suggestions
    };
  }

  function buildWidget(root, state) {
    const P = PRIMARY;
    const A = ACCENT;

    const style = document.createElement('style');
    style.textContent = `
      .kfw *{box-sizing:border-box;margin:0;padding:0}
      .kfw{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:440px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.12);overflow:hidden;color:#333}
      .kfh{background:linear-gradient(135deg,${P},${A});padding:24px;text-align:center;color:white}
      .kfh-icon{font-size:36px;display:block;margin-bottom:6px;animation:kffloat 3s ease-in-out infinite}
      @keyframes kffloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      .kfh h3{font-size:20px;font-weight:800;margin-bottom:3px}
      .kfh p{font-size:12px;opacity:.85}
      .kfbody{padding:22px}
      .kfcat{display:flex;background:#f0f0f8;border-radius:12px;padding:3px;margin-bottom:20px;gap:3px}
      .kfcat-btn{flex:1;padding:10px;border:none;border-radius:10px;font-size:13px;font-weight:600;color:#888;background:transparent;cursor:pointer;font-family:inherit;transition:all .2s}
      .kfcat-btn.on{background:white;color:${P};box-shadow:0 2px 8px rgba(0,0,0,.08)}
      .kferr{display:none;padding:10px 14px;background:#fff0f3;border:1px solid #fcc;border-radius:8px;color:#c0392b;font-size:13px;text-align:center;margin-bottom:14px}
      .kferr.on{display:block}
      .kfrow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
      .kfrow.one{grid-template-columns:1fr}
      .kflbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#666;margin-bottom:5px;display:block}
      .kfinp,.kfsel{width:100%;padding:11px 13px;border:2px solid #e8e6ff;border-radius:10px;font-size:14px;font-family:inherit;background:#fafafe;outline:none;transition:border-color .2s;-webkit-appearance:none;appearance:none;color:#333}
      .kfsel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236C63FF' d='M5 6L0 0h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:30px;cursor:pointer}
      .kfinp:focus,.kfsel:focus{border-color:${P};box-shadow:0 0 0 3px ${P}25}
      .kfpills{display:flex;gap:6px}
      .kfpill{flex:1;padding:9px 5px;border:2px solid #e8e6ff;border-radius:10px;background:#fafafe;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#777;font-family:inherit;transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:2px}
      .kfpill-ic{font-size:16px}
      .kfpill:hover{border-color:${P}50}
      .kfpill.on{border-color:${P};background:${P}12;color:${P}}
      .kfgrow{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff8f5;border:2px solid #ffe4d4;border-radius:12px;cursor:pointer;margin-bottom:18px;transition:all .2s}
      .kfgrow.on{border-color:${A};background:#fff3ee}
      .kfchk{width:22px;height:22px;border:2px solid #ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;background:white;flex-shrink:0;font-size:13px;font-weight:bold;color:transparent;transition:all .2s}
      .kfgrow.on .kfchk{background:${A};border-color:${A};color:white}
      .kfgtxt{font-size:13px;font-weight:600;color:#666}
      .kfgtxt small{font-size:11px;font-weight:400;color:#aaa;display:block;margin-top:1px}
      .kfsubmit{width:100%;padding:15px;background:linear-gradient(135deg,${P},${A});color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s;display:flex;align-items:center;justify-content:center;gap:8px}
      .kfsubmit:hover{transform:translateY(-2px);box-shadow:0 6px 20px ${P}45}
      .kfsubmit:disabled{opacity:.7;cursor:wait;transform:none}
      .kfload{padding:50px 20px;text-align:center;display:none}
      .kfload.on{display:block}
      .kfspinner{width:46px;height:46px;border:4px solid #eee;border-top-color:${P};border-radius:50%;animation:kfspin .7s linear infinite;margin:0 auto 16px}
      @keyframes kfspin{to{transform:rotate(360deg)}}
      .kfload-txt{font-size:14px;color:#888;font-weight:500}
      .kfres{display:none}
      .kfres.on{display:block;animation:kfslide .4s ease}
      @keyframes kfslide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
      .kfres-top{background:linear-gradient(135deg,${P}10,${A}08);padding:28px;text-align:center;border-bottom:1px solid #f0eeff}
      .kfres-badge{display:inline-block;padding:4px 14px;background:${P}18;color:${P};border-radius:20px;font-size:11px;font-weight:700;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px}
      .kfres-size{font-size:64px;font-weight:900;line-height:1;background:linear-gradient(135deg,${P},${A});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:kfpop .5s cubic-bezier(.34,1.56,.64,1)}
      @keyframes kfpop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
      .kfres-lbl{font-size:13px;color:#888;margin:5px 0 12px;font-weight:500}
      .kfres-fit{display:inline-block;padding:7px 18px;background:white;border-radius:20px;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.07)}
      .kfres-body{padding:22px}
      .kfconf-hdr{display:flex;justify-content:space-between;font-size:12px;color:#888;font-weight:600;margin-bottom:6px}
      .kfconf-pct{font-size:14px;font-weight:700;color:${P}}
      .kfconf-bar{height:9px;background:#eee;border-radius:5px;overflow:hidden}
      .kfconf-fill{height:100%;background:linear-gradient(90deg,${P},${A});border-radius:5px;transition:width .9s cubic-bezier(.25,1,.5,1);width:0}
      .kfmeas{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
      .kfmitem{padding:11px;background:#f8f8ff;border-radius:10px;text-align:center}
      .kfmval{font-size:15px;font-weight:800;color:${P};display:block}
      .kfmlbl{font-size:10px;color:#aaa;text-transform:uppercase;font-weight:600;margin-top:2px;display:block}
      .kfsugg{font-size:12px;color:#777;padding:10px 13px;background:#fffbf0;border-left:3px solid #FFB74D;border-radius:0 8px 8px 0;margin-bottom:8px;line-height:1.5}
      .kfactions{display:flex;gap:8px;margin-top:18px}
      .kfbtn-shop{flex:1;padding:13px;background:linear-gradient(135deg,${A},#ff8fa3);color:white;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s}
      .kfbtn-shop:hover{transform:translateY(-2px);box-shadow:0 5px 16px ${A}45}
      .kfbtn-retry{padding:13px 16px;background:#f0f0f8;color:#666;border:none;border-radius:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
      .kfbtn-retry:hover{background:#e5e5f0}
      .kffoot{padding:10px 20px 14px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #f5f5f5}
      @media(max-width:400px){.kfrow{grid-template-columns:1fr}.kfres-size{font-size:52px}}
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="kfw">
        <div class="kfh">
          <span class="kfh-icon">👶</span>
          <h3>Kids Size Finder</h3>
          <p>Get the perfect size instantly</p>
        </div>

        <div id="kf-form-area">
          <div class="kfbody">
            <div class="kfcat">
              <button class="kfcat-btn on" data-cat="tops">👕 Tops</button>
              <button class="kfcat-btn" data-cat="bottoms">👖 Bottoms</button>
            </div>

            <div class="kferr" id="kf-err">⚠️ Please enter Age or Height</div>

            <div class="kfrow">
              <div>
                <span class="kflbl">🎂 Age</span>
                <select class="kfsel" id="kf-age">
                  <option value="">Select age</option>
                  <option value="0">Under 1 year</option>
                  <option value="1">1 year</option>
                  <option value="2">2 years</option>
                  <option value="3">3 years</option>
                  <option value="4">4 years</option>
                  <option value="5">5 years</option>
                  <option value="6">6 years</option>
                  <option value="7">7 years</option>
                  <option value="8">8 years</option>
                  <option value="9">9 years</option>
                  <option value="10">10 years</option>
                  <option value="11">11 years</option>
                  <option value="12">12 years</option>
                  <option value="13">13 years</option>
                  <option value="14">14 years</option>
                </select>
              </div>
              <div>
                <span class="kflbl">📏 Height (cm)</span>
                <input type="number" class="kfinp" id="kf-height" placeholder="e.g. 95" min="40" max="180" inputmode="numeric">
              </div>
            </div>

            <div class="kfrow">
              <div>
                <span class="kflbl">⚖️ Weight (kg)</span>
                <input type="number" class="kfinp" id="kf-weight" placeholder="e.g. 14" min="2" max="70" inputmode="decimal">
              </div>
              <div>
                <span class="kflbl">✂️ Fit Style</span>
                <div class="kfpills" id="kf-fit">
                  <button class="kfpill" data-v="slim">
                    <span class="kfpill-ic">🤏</span>Slim
                  </button>
                  <button class="kfpill on" data-v="regular">
                    <span class="kfpill-ic">👌</span>Regular
                  </button>
                  <button class="kfpill" data-v="loose">
                    <span class="kfpill-ic">🤗</span>Loose
                  </button>
                </div>
              </div>
            </div>

            <div class="kfgrow" id="kf-grow">
              <div class="kfchk" id="kf-chk">✓</div>
              <div class="kfgtxt">
                🌱 Buy for next 3-6 months
                <small>Recommend one size up for growing</small>
              </div>
            </div>

            <button class="kfsubmit" id="kf-submit">
              ✨ Find Perfect Size
            </button>
          </div>
        </div>

        <div class="kfload" id="kf-load">
          <div class="kfspinner"></div>
          <div class="kfload-txt">Analyzing measurements...</div>
        </div>

        <div class="kfres" id="kf-result">
          <div class="kfres-top">
            <div class="kfres-badge" id="kf-conf-label">🎯 Best Fit</div>
            <div class="kfres-size" id="kf-size-display">--</div>
            <div class="kfres-lbl" id="kf-size-label">Recommended Size</div>
            <div class="kfres-fit" id="kf-fit-desc">✨ Perfect Fit</div>
          </div>
          <div class="kfres-body">
            <div class="kfconf-hdr">
              <span>Confidence Score</span>
              <span class="kfconf-pct" id="kf-conf-pct">85%</span>
            </div>
            <div class="kfconf-bar">
              <div class="kfconf-fill" id="kf-conf-bar"></div>
            </div>
            <div class="kfmeas" id="kf-measurements"></div>
            <div id="kf-suggestions"></div>
            <div class="kfactions">
              <button class="kfbtn-shop" id="kf-shop-btn">🛒 Shop This Size</button>
              <button class="kfbtn-retry" id="kf-retry-btn">↩ New Search</button>
            </div>
          </div>
        </div>

        <div class="kffoot">Sizes approximate · Measure child for best results</div>
      </div>
    `;

    let shadowRoot;
    try {
      shadowRoot = root.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(wrapper);
    } catch(e) {
      root.appendChild(style);
      root.appendChild(wrapper);
      shadowRoot = root;
    }

    // State
    let currentCat = 'tops';
    let currentFit = 'regular';
    let currentGrowth = false;
    let lastResult = null;

    const $ = (sel) => shadowRoot.querySelector(sel);
    const $$ = (sel) => shadowRoot.querySelectorAll(sel);

    // Category buttons
    $$('.kfcat-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        $$('.kfcat-btn').forEach(b => b.classList.remove('on'));
        this.classList.add('on');
        currentCat = this.dataset.cat;
      });
    });

    // Fit pills
    $$('#kf-fit .kfpill').forEach(pill => {
      pill.addEventListener('click', function() {
        $$('#kf-fit .kfpill').forEach(p => p.classList.remove('on'));
        this.classList.add('on');
        currentFit = this.dataset.v;
      });
    });

    // Growth toggle
    $('#kf-grow').addEventListener('click', function() {
      currentGrowth = !currentGrowth;
      this.classList.toggle('on', currentGrowth);
    });

    // Submit
    $('#kf-submit').addEventListener('click', async function() {
      const age = $('#kf-age').value;
      const height = $('#kf-height').value;
      const weight = $('#kf-weight').value;

      // Validate
      if (!age && !height) {
        $('#kf-err').classList.add('on');
        setTimeout(() => $('#kf-err').classList.remove('on'), 3500);
        return;
      }

      // Show loading
      this.disabled = true;
      $('#kf-form-area').style.display = 'none';
      $('#kf-load').classList.add('on');
      $('#kf-result').classList.remove('on');

      // Small delay for UX
      await new Promise(r => setTimeout(r, 700));

      // Calculate
      try {
        lastResult = recommend({
          ageYears: age !== '' ? age : null,
          height: height || null,
          weight: weight || null,
          fit: currentFit,
          growth: currentGrowth,
          cat: currentCat
        });

        // Show result
        $('#kf-load').classList.remove('on');
        $('#kf-conf-label').textContent = lastResult.confLabel;
        $('#kf-size-display').textContent = lastResult.size;
        $('#kf-size-label').textContent = lastResult.label;
        $('#kf-fit-desc').textContent = lastResult.fitDesc;
        $('#kf-conf-pct').textContent = lastResult.conf + '%';

        setTimeout(() => {
          $('#kf-conf-bar').style.width = lastResult.conf + '%';
        }, 150);

        // Measurements
        let mHTML = '';
        if (lastResult.height) {
          mHTML += `<div class="kfmitem">
            <span class="kfmval">${lastResult.height[0]}-${lastResult.height[1]}</span>
            <span class="kfmlbl">Height (cm)</span>
          </div>`;
        }
        if (lastResult.weight) {
          mHTML += `<div class="kfmitem">
            <span class="kfmval">${lastResult.weight[0]}-${lastResult.weight[1]}</span>
            <span class="kfmlbl">Weight (kg)</span>
          </div>`;
        }
        $('#kf-measurements').innerHTML = mHTML;

        // Suggestions
        $('#kf-suggestions').innerHTML = lastResult.suggestions
          .map(s => `<div class="kfsugg">${s}</div>`).join('');

        $('#kf-result').classList.add('on');

      } catch(err) {
        console.error('KidsFit Error:', err);
        $('#kf-load').classList.remove('on');
        $('#kf-form-area').style.display = 'block';
        $('#kf-err').textContent = '⚠️ Something went wrong. Please try again.';
        $('#kf-err').classList.add('on');
        setTimeout(() => $('#kf-err').classList.remove('on'), 3500);
      }

      this.disabled = false;
    });

    // Retry button
    $('#kf-retry-btn').addEventListener('click', function() {
      $('#kf-result').classList.remove('on');
      $('#kf-conf-bar').style.width = '0';
      $('#kf-form-area').style.display = 'block';
      $('#kf-age').value = '';
      $('#kf-height').value = '';
      $('#kf-weight').value = '';
      lastResult = null;
    });

    // Shop button
    $('#kf-shop-btn').addEventListener('click', function() {
      if (lastResult && SHOP_URL) {
        const url = SHOP_URL.includes('?')
          ? `${SHOP_URL}&size=${encodeURIComponent(lastResult.size)}`
          : `${SHOP_URL}?size=${encodeURIComponent(lastResult.size)}`;
        window.open(url, '_blank');
      } else if (lastResult) {
        alert('Recommended Size: ' + lastResult.size + ' (' + lastResult.label + ')');
      }
    });
  }

  // Initialize
  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      buildWidget(container, {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }

})();
