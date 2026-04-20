/**
 * KidsFit - Embeddable Widget
 * Paste into any website with ONE script tag
 */
(function () {
  'use strict';

  const cfg = window.KidsSizeToolConfig || {};
  const PRIMARY = cfg.primaryColor || '#6C63FF';
  const ACCENT = cfg.accentColor || '#FF6584';
  const CONTAINER_ID = cfg.containerId || 'kidswear-size-tool';
  const API_URL = cfg.apiUrl || '';
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
      "1-2Y": { label: "1-2 Years", ageMonths: [12,24], height: [76,90], weight: [10,13] },
      "2-3Y": { label: "2-3 Years", ageMonths: [24,36], height: [90,98], weight: [13,15] },
      "3-4Y": { label: "3-4 Years", ageMonths: [36,48], height: [98,104], weight: [15,17] },
      "4-5Y": { label: "4-5 Years", ageMonths: [48,60], height: [104,110], weight: [17,20] },
      "5-6Y": { label: "5-6 Years", ageMonths: [60,72], height: [110,116], weight: [20,22] },
      "8-10Y": { label: "8-10 Years", ageMonths: [96,120], height: [128,140], weight: [28,35] },
      "12-14Y": { label: "12-14 Years", ageMonths: [144,168], height: [152,164], weight: [45,55] }
    }
  };

  function score(v, mn, mx) {
    if (!v) return 0;
    const r = mx - mn || 1, mid = (mn + mx) / 2;
    if (v >= mn && v <= mx) return 1 - (Math.abs(v - mid) / (r / 2)) * 0.3;
    return Math.max(0, 0.7 - (Math.abs(v < mn ? mn - v : v - mx) / r) * 0.5);
  }

  function recommend(inputs) {
    const { ageYears, height, weight, fit, growth, cat } = inputs;
    const chart = SIZE_CHARTS[cat] || SIZE_CHARTS.tops;
    const keys = Object.keys(chart);
    const age = ageYears !== '' && ageYears !== null ? Number(ageYears) * 12 : null;
    const h = height ? Number(height) : null;
    const w = weight ? Number(weight) : null;

    const scored = keys.map(k => {
      const s = chart[k]; let t = 0, f = 0;
      if (age !== null) { t += score(age, s.ageMonths[0], s.ageMonths[1]) * 0.3; f += 0.3; }
      if (h) { t += score(h, s.height[0], s.height[1]) * 0.4; f += 0.4; }
      if (w) { t += score(w, s.weight[0], s.weight[1]) * 0.3; f += 0.3; }
      if (f > 0 && f < 1) t /= f;
      const i = keys.indexOf(k);
      if (fit === 'slim' && i > 0) t -= 0.04;
      if (fit === 'loose' && i < keys.length - 1) t += 0.04;
      return { k, label: s.label, t: Math.round(t * 1000) / 1000, d: s };
    }).sort((a, b) => b.t - a.t);

    let p = { ...scored[0] }, ga = false;
    if (growth) {
      const ci = keys.indexOf(p.k);
      if (ci < keys.length - 1) { p = { ...scored.find(s => s.k === keys[ci + 1]) || scored[0] }; ga = true; }
    }

    const ic = (age !== null ? 1 : 0) + (h ? 1 : 0) + (w ? 1 : 0);
    let cp = Math.min(98, 55 + ic * 12 + (p.t > 0.85 ? 20 : p.t > 0.70 ? 12 : p.t > 0.55 ? 5 : 0));
    const cl = p.t > 0.85 ? '🎯 Best Fit' : p.t > 0.70 ? '✅ Good Fit' : '👍 Reasonable Fit';
    const fd = ga ? '🌱 Room to Grow' : fit === 'slim' ? '🤏 Snug Fit' : fit === 'loose' ? '🤗 Loose Fit' : '✨ Perfect Fit';

    return { size: p.k, label: p.label, conf: cp, cl, fd, ga, height: p.d?.height, weight: p.d?.weight };
  }

  const CSS = `
    .kfw{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:420px;margin:0 auto;background:#fff;border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.10);overflow:hidden;color:#333}
    .kfh{background:linear-gradient(135deg,${PRIMARY},${ACCENT});padding:22px;text-align:center;color:white}
    .kfh h3{font-size:18px;font-weight:800;margin:4px 0 2px}
    .kfh p{font-size:12px;opacity:.85}
    .kfb{padding:20px}
    .kfrow{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
    .kfrow.one{grid-template-columns:1fr}
    .kflbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#666;margin-bottom:5px;display:block}
    .kfinp,.kfsel{width:100%;padding:11px 13px;border:2px solid #e8e6ff;border-radius:10px;font-size:14px;font-family:inherit;background:#fafafe;outline:none;-webkit-appearance:none;appearance:none;transition:border-color .2s}
    .kfsel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236C63FF' d='M5 7L0 2h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:30px;cursor:pointer}
    .kfinp:focus,.kfsel:focus{border-color:${PRIMARY};box-shadow:0 0 0 3px ${PRIMARY}20}
    .kfpills{display:flex;gap:6px}
    .kfpill{flex:1;padding:9px 6px;border:2px solid #e8e6ff;border-radius:10px;background:#fafafe;text-align:center;cursor:pointer;font-size:12px;font-weight:600;color:#777;font-family:inherit;transition:all .2s}
    .kfpill.on{border-color:${PRIMARY};background:${PRIMARY}15;color:${PRIMARY}}
    .kfgrow{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff8f5;border:2px solid #ffe4d4;border-radius:12px;cursor:pointer;margin-bottom:16px;transition:all .2s}
    .kfgrow.on{border-color:${ACCENT};background:#fff3ee}
    .kfchk{width:20px;height:20px;border:2px solid #ddd;border-radius:6px;display:flex;align-items:center;justify-content:center;background:white;flex-shrink:0;font-size:12px;font-weight:bold;color:transparent;transition:all .2s}
    .kfgrow.on .kfchk{background:${ACCENT};border-color:${ACCENT};color:white}
    .kfgtxt{font-size:13px;font-weight:600;color:#666}
    .kfgtxt small{font-size:11px;font-weight:400;color:#999;display:block}
    .kfbtn{width:100%;padding:15px;background:linear-gradient(135deg,${PRIMARY},${ACCENT});color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s}
    .kfbtn:hover{transform:translateY(-2px);box-shadow:0 6px 20px ${PRIMARY}40}
    .kfbtn:disabled{opacity:.7;cursor:wait;transform:none}
    .kfload{padding:48px 20px;text-align:center;display:none}
    .kfload.on{display:block}
    .kfsp{width:44px;height:44px;border:4px solid #eee;border-top-color:${PRIMARY};border-radius:50%;animation:kfspin .7s linear infinite;margin:0 auto 14px}
    @keyframes kfspin{to{transform:rotate(360deg)}}
    .kfres{display:none}
    .kfres.on{display:block;animation:kffade .4s ease}
    @keyframes kffade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    .kfrtop{background:linear-gradient(135deg,${PRIMARY}12,${ACCENT}08);padding:28px;text-align:center;border-bottom:1px solid #f0eeff}
    .kfrbadge{display:inline-block;padding:4px 12px;background:${PRIMARY}15;color:${PRIMARY};border-radius:20px;font-size:11px;font-weight:700;margin-bottom:12px;text-transform:uppercase}
    .kfrsize{font-size:58px;font-weight:900;background:linear-gradient(135deg,${PRIMARY},${ACCENT});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;animation:kfpop .5s cubic-bezier(.34,1.56,.64,1)}
    @keyframes kfpop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
    .kfrlbl{font-size:13px;color:#888;margin:4px 0 10px}
    .kfrfit{display:inline-block;padding:7px 16px;background:white;border-radius:20px;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,.06)}
    .kfrbody{padding:20px}
    .kfcbar{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin-top:6px}
    .kfcfill{height:100%;background:linear-gradient(90deg,${PRIMARY},${ACCENT});border-radius:4px;transition:width .8s ease;width:0}
    .kfmeas{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}
    .kfmitem{padding:10px;background:#f8f8ff;border-radius:10px;text-align:center}
    .kfmval{font-size:14px;font-weight:800;color:${PRIMARY};display:block}
    .kfmlbl{font-size:10px;color:#aaa;text-transform:uppercase;font-weight:600}
    .kfsugg{font-size:12px;color:#888;padding:10px 12px;background:#fffbf0;border-left:3px solid #FFB74D;border-radius:0 8px 8px 0;margin-bottom:8px}
    .kfacts{display:flex;gap:8px;margin-top:16px}
    .kfashop{flex:1;padding:13px;background:${ACCENT};color:white;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s}
    .kfashop:hover{transform:translateY(-2px);box-shadow:0 5px 15px ${ACCENT}40}
    .kfareset{padding:13px 16px;background:#f0f0f8;color:#666;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
    .kferr{display:none;padding:10px 14px;background:#fff0f3;border:1px solid #fcc;border-radius:8px;color:#c0392b;font-size:13px;text-align:center;margin-bottom:12px}
    .kferr.on{display:block}
    .kffoot{padding:10px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #f5f5f5}
  `;

  const HTML = `
    <div class="kfw">
      <div class="kfh">
        <div style="font-size:32px;margin-bottom:4px">👶</div>
        <h3>Kids Size Finder</h3>
        <p>Enter your child's details for an instant recommendation</p>
      </div>
      <div class="kfb" id="kf-form">
        <div class="kferr" id="kf-err">Please enter age or height</div>
        <div class="kfrow">
          <div>
            <span class="kflbl">🎂 Age</span>
            <select class="kfsel" id="kf-age">
              <option value="">Select age</option>
              <option value="0">Under 1 yr</option>
              ${Array.from({length:14},(_,i)=>`<option value="${i+1}">${i+1} year${i>0?'s':''}</option>`).join('')}
            </select>
          </div>
          <div>
            <span class="kflbl">📏 Height (cm)</span>
            <input type="number" class="kfinp" id="kf-ht" placeholder="e.g. 95" min="40" max="180" inputmode="numeric">
          </div>
        </div>
        <div class="kfrow">
          <div>
            <span class="kflbl">⚖️ Weight (kg)</span>
            <input type="number" class="kfinp" id="kf-wt" placeholder="e.g. 15" min="2" max="70" inputmode="decimal">
          </div>
          <div>
            <span class="kflbl">✂️ Fit Style</span>
            <div class="kfpills" id="kf-fit">
              <button class="kfpill" data-v="slim">🤏 Slim</button>
              <button class="kfpill on" data-v="regular">👌 Reg</button>
              <button class="kfpill" data-v="loose">🤗 Loose</button>
            </div>
          </div>
        </div>
        <div class="kfgrow" id="kf-grow">
          <div class="kfchk" id="kf-chk">✓</div>
          <div class="kfgtxt">🌱 Buy for next 3-6 months<small>Recommend one size up</small></div>
        </div>
        <button class="kfbtn" id="kf-btn">✨ Find Perfect Size</button>
      </div>
      <div class="kfload" id="kf-load">
        <div class="kfsp"></div>
        <div style="font-size:13px;color:#888;font-weight:500">Analyzing measurements...</div>
      </div>
      <div class="kfres" id="kf-res">
        <div class="kfrtop">
          <div class="kfrbadge" id="kf-cl">🎯 Best Fit</div>
          <div class="kfrsize" id="kf-sz">--</div>
          <div class="kfrlbl" id="kf-lbl">Recommended Size</div>
          <div class="kfrfit" id="kf-fd">✨ Perfect Fit</div>
        </div>
        <div class="kfrbody">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;font-weight:600;margin-bottom:4px">
            <span>Confidence</span><span id="kf-cp" style="color:${PRIMARY};font-size:13px;font-weight:700">80%</span>
          </div>
          <div class="kfcbar"><div class="kfcfill" id="kf-bar"></div></div>
          <div class="kfmeas" id="kf-meas"></div>
          <div id="kf-sugg"></div>
          <div class="kfacts">
            <button class="kfashop" id="kf-shop">🛒 Shop This Size</button>
            <button class="kfareset" id="kf-reset">↩ Retry</button>
          </div>
        </div>
      </div>
      <div class="kffoot">Sizes are approximate. Measure your child for best results.</div>
    </div>
  `;

  function init() {
    const el = document.getElementById(CONTAINER_ID);
    if (!el) return;

    let shadow;
    try {
      shadow = el.attachShadow({ mode: 'open' });
    } catch (e) {
      // Fallback if Shadow DOM not supported
      el.innerHTML = `<style>${CSS}</style>${HTML}`;
      bindEvents(el);
      return;
    }

    shadow.innerHTML = `<style>${CSS}</style>${HTML}`;
    bindEvents(shadow);
  }

  function bindEvents(root) {
    const $ = s => root.querySelector(s);
    const $$ = s => root.querySelectorAll(s);
    let grow = false, fit = 'regular', result = null;

    $$('#kf-fit .kfpill').forEach(p => {
      p.addEventListener('click', () => {
        $$('#kf-fit .kfpill').forEach(x => x.classList.remove('on'));
        p.classList.add('on');
        fit = p.dataset.v;
      });
    });

    $('#kf-grow').addEventListener('click', function () {
      grow = !grow;
      this.classList.toggle('on', grow);
    });

    $('#kf-btn').addEventListener('click', async () => {
      const age = $('#kf-age').value;
      const ht = $('#kf-ht').value;
      const wt = $('#kf-wt').value;

      if (!age && !ht) {
        $('#kf-err').classList.add('on');
        setTimeout(() => $('#kf-err').classList.remove('on'), 3000);
        return;
      }

      $('#kf-btn').disabled = true;
      $('#kf-form').style.display = 'none';
      $('#kf-load').classList.add('on');
      $('#kf-res').classList.remove('on');

      await new Promise(r => setTimeout(r, 600));

      result = recommend({ ageYears: age, height: ht, weight: wt, fit, growth: grow, cat: 'tops' });

      $('#kf-load').classList.remove('on');
      $('#kf-cl').textContent = result.cl;
      $('#kf-sz').textContent = result.size;
      $('#kf-lbl').textContent = result.label;
      $('#kf-fd').textContent = result.fd;
      $('#kf-cp').textContent = result.conf + '%';
      setTimeout(() => { $('#kf-bar').style.width = result.conf + '%'; }, 100);

      let mh = '';
      if (result.height) mh += `<div class="kfmitem"><span class="kfmval">${result.height[0]}-${result.height[1]}</span><span class="kfmlbl">Height cm</span></div>`;
      if (result.weight) mh += `<div class="kfmitem"><span class="kfmval">${result.weight[0]}-${result.weight[1]}</span><span class="kfmlbl">Weight kg</span></div>`;
      $('#kf-meas').innerHTML = mh;

      if (!grow) {
        const keys = Object.keys(SIZE_CHARTS.tops);
        const ni = keys.indexOf(result.size);
        if (ni < keys.length - 1) {
          $('#kf-sugg').innerHTML = `<div class="kfsugg">💡 For longer wear, also consider ${SIZE_CHARTS.tops[keys[ni+1]].label}</div>`;
        }
      }

      $('#kf-res').classList.add('on');
      $('#kf-btn').disabled = false;
    });

    $('#kf-reset').addEventListener('click', () => {
      $('#kf-res').classList.remove('on');
      $('#kf-bar').style.width = '0';
      $('#kf-form').style.display = 'block';
      $('#kf-age').value = '';
      $('#kf-ht').value = '';
      $('#kf-wt').value = '';
    });

    $('#kf-shop').addEventListener('click', () => {
      if (SHOP_URL && result) {
        window.open(`${SHOP_URL}?size=${encodeURIComponent(result.size)}`, '_blank');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();
