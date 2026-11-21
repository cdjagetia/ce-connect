/* CE Connect — 👷 Labour module (attendance · wages · advances · reports). Plugs into app.js via window.CE */
(function () {
'use strict';
const CE = window.CE; if (!CE) return;
const { api, routes, t, esc, inr, fmtDate, fmtDT, can, toast, spinner, go, render, Q, refreshQueueBar, openFile, store, CFG } = CE;
const $app = document.getElementById('app');
const $ = id => document.getElementById(id);
const val = id => { const el = $(id); return el ? String(el.value).trim() : ''; };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const month0 = () => today().slice(0, 7);
const n2 = x => (Math.round((Number(x) || 0) * 100) / 100).toLocaleString('en-IN');
const rs = x => (Number(x) < 0 ? '−' : '') + inr(x);
const ROLE_HI = { OPERATOR: 'ऑपरेटर', DRIVER: 'ड्राइवर', HELPER: 'हेल्पर', MECHANIC: 'मैकेनिक', DRILLER: 'ड्रिलर', BLASTER: 'ब्लास्टर', SUPERVISOR: 'सुपरवाइज़र', MUNIM: 'मुनीम', OTHER: 'अन्य' };
const ST_HI = { P: 'हाज़िर', HD: 'आधा दिन', A: 'ग़ैरहाज़िर', L: 'छुट्टी', WO: 'साप्ताहिक छुट्टी', H: 'त्योहार छुट्टी', ON: 'ड्यूटी पर' };
const TX_HI = { PAYMENT: 'भुगतान', ADVANCE: 'एडवांस', BHATTA: 'भत्ता', BONUS: 'इनाम', DEDUCTION: 'कटौती' };
const EV_HI = { BREAKDOWN: '🔧 मशीन ख़राब', ACCIDENT: '🚑 दुर्घटना', LEAVE: '🗓️ छुट्टी की अर्ज़ी', COMPLAINT: '📝 शिकायत' };
const CHALLENGES = ['✌️ दो उंगली दिखाएँ', '👍 अंगूठा ऊपर दिखाएँ', '✋ पूरा हाथ खोलकर दिखाएँ', '☝️ एक उंगली दिखाएँ', '👌 OK का इशारा करें', '🤚 हाथ कान के पास रखें'];
const deviceId = (() => { let d = store.get('deviceId', ''); if (!d) { d = 'D' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); store.set('deviceId', d); } return d; })();

// ── styles
const css = `
.ltabs{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;margin:0 -2px 6px;scrollbar-width:none}.ltabs::-webkit-scrollbar{display:none}
.ltabs a{flex:none;text-decoration:none;font:700 13.5px var(--font);padding:8px 14px;border-radius:30px;background:#fff;border:1px solid var(--line);color:var(--navy)}
.ltabs a.on{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border-color:var(--navy)}
.filt{display:grid;grid-template-columns:1fr 1fr;gap:8px}.filt label{margin:4px 0 2px;font-size:12px}.filt input,.filt select{padding:9px 10px;font-size:14px}
.st{display:inline-block;min-width:26px;text-align:center;font:700 11px var(--num);border-radius:7px;padding:3px 6px}
.st.P{background:#DCFCE7;color:#047857}.st.HD{background:#FEF3C7;color:#92400E}.st.A{background:#FEE2E2;color:#B91C1C}.st.L,.st.WO,.st.H{background:#E0E7FF;color:#3730A3}.st.ON{background:#DBEAFE;color:#1D4ED8}.st.q{outline:2px dashed #F59E0B}
.mus td,.mus th{padding:4px 3px!important;font-size:11px!important;text-align:center}.mus td:first-child,.mus th:first-child{text-align:left;position:sticky;left:0;background:#fff;z-index:1;min-width:110px}
.thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.thumbs figure{margin:0;background:#F1F5F9;border-radius:10px;overflow:hidden;aspect-ratio:3/4;position:relative;display:grid;place-items:center;font-size:11px;color:var(--muted)}
.thumbs img{width:100%;height:100%;object-fit:cover}.thumbs figcaption{position:absolute;left:0;right:0;bottom:0;background:rgba(11,31,58,.7);color:#fff;font-size:10.5px;padding:2px 4px;text-align:center}
.vcard{border-left:4px solid var(--line)}.vcard.RED{border-left-color:var(--red)}.vcard.WATCH{border-left-color:var(--amber)}.vcard.OK{border-left-color:var(--green)}
.duty-hero{text-align:center;padding:22px 16px}.duty-hero .big{font:800 30px var(--num);color:var(--navy)}.duty-hero .since{font-size:14px;color:var(--muted)}
.chk{display:flex;align-items:center;gap:10px;padding:12px;border:1.5px solid var(--line);border-radius:12px;margin:6px 0;font-weight:600;cursor:pointer}.chk input{width:22px;height:22px;flex:none}
.chk.on{border-color:var(--green);background:#F0FDF4}
.challenge{background:linear-gradient(135deg,#FFF7E6,#FDECC8);border:1px dashed var(--gold);border-radius:14px;padding:12px;text-align:center;font:700 17px var(--font);color:#7A4B00;margin:8px 0}
.wl .item{align-items:center}.wl input[type=checkbox]{width:22px;height:22px;flex:none}
.sumrow{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.sumrow span{background:#fff;border:1px solid var(--line);border-radius:20px;padding:4px 10px;font:600 12.5px var(--num)}
.mini{font-size:12px;color:var(--muted)}.right{text-align:right}.nowrap{white-space:nowrap}
.lcard{display:block;text-decoration:none;color:inherit;background:linear-gradient(135deg,#F7FBFF,#EEF4FF);border:1px solid #D6E2F5}
.seg{display:flex;gap:6px;flex-wrap:wrap}.seg span{flex:1 1 auto;text-align:center;padding:10px 8px;border:1.5px solid var(--line);border-radius:12px;font-weight:700;cursor:pointer;background:#fff;font-size:14px}.seg span.on{border-color:var(--navy);background:var(--navy);color:#fff}
@media print{.ltabs,.filt,.noprint{display:none!important}}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

// ── helpers
let META = store.get('labMeta', null);
async function meta(force) {
  if (META && !force && META._at && Date.now() - META._at < 120000) return META;
  try { META = await api('labourMeta'); META._at = Date.now(); store.set('labMeta', META); } catch (e) { if (!META || e.message === 'AUTH') throw e; }
  return META;
}
const siteName = code => { const s = (META && META.sites || []).find(x => x.code === code); return s ? s.name : code || ''; };
const imgCache = {};
async function imgUrl(fileId) {
  if (!imgCache[fileId]) { const r = await api('getFile', { fileId }); const bin = atob(r.data), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); imgCache[fileId] = URL.createObjectURL(new Blob([a], { type: r.mimeType })); }
  return imgCache[fileId];
}
async function loadImg(fileId, el) {
  if (!fileId || !el) return;
  try {
    await imgUrl(fileId);
    el.innerHTML = `<img src="${imgCache[fileId]}" alt="">` + (el.dataset.cap ? `<figcaption>${esc(el.dataset.cap)}</figcaption>` : '');
    el.onclick = () => window.open(imgCache[fileId], '_blank');
  } catch (e) { el.textContent = '—'; }
}
function lazyImgs(root) { (root || document).querySelectorAll('[data-img]').forEach(el => { const id = el.dataset.img; el.removeAttribute('data-img'); loadImg(id, el); }); }
function csv(name, head, rows) {
  const q = v => { const s = String(v === undefined || v === null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const txt = '﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = name + '.csv'; document.body.appendChild(a); a.click(); a.remove();
}
function letterhead(title) { return `<div class="print-only lh"><div><b>Choudhary Enterprises</b><div class="small muted">${esc(title)}</div></div><div class="small">${new Date().toLocaleString('en-IN')}<br>System by ${esc(CFG.FIRM_NAME || 'P Jagetia & Associates')}</div></div>`; }
function hiText(x) { const m = String(x || '').match(/^([A-Z]+)(.*)$/); if (!m) return x; const k = m[1]; return (ST_HI[k] || TX_HI[k] || k) + m[2]; }
function stBadge(s) { const q = /\?$/.test(s); const k = String(s || '').replace('?', ''); return `<span class="st ${esc(k)} ${q ? 'q' : ''}" title="${esc(ST_HI[k] || k)}${q ? ' (मंज़ूरी बाक़ी)' : ''}">${esc(k === 'HD' ? '½' : k || '—')}</span>`; }
function riskBadge(r) { return r && r !== 'OK' ? `<span class="badge ${r}">${r === 'RED' ? '🔴 संदिग्ध' : '🟠 जाँचें'}</span>` : ''; }
function mapLink(lat, lng) { return lat && lng ? `<a target="_blank" href="https://maps.google.com/?q=${lat},${lng}">📍 नक्शा</a>` : ''; }
function gps() {
  return new Promise(res => {
    if (!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }), () => res(null), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  });
}
function gpsBox(id, holder) {
  const g = $(id); if (!g) return;
  g.className = 'gps wait'; g.innerHTML = '<span class="dot"></span><span>लोकेशन ली जा रही है…</span>';
  gps().then(p => {
    holder.gps = p; if (!$(id)) return;
    if (p) { g.className = 'gps ok'; g.innerHTML = `<span class="dot"></span><span>लोकेशन मिल गई · ±${p.acc} मीटर</span>`; }
    else { g.className = 'gps bad'; g.innerHTML = '<span class="dot"></span><span>लोकेशन नहीं मिली — GPS चालू करें</span><a id="' + id + 'R">फिर कोशिश</a>'; $(id + 'R').onclick = () => gpsBox(id, holder); }
  });
}
// photo: resize + watermark; returns {data, hash}
function snap(file, label, holder) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height; const max = 1100;
      if (w >= h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
      // average hash (before watermark)
      const s = document.createElement('canvas'); s.width = 8; s.height = 8; const sx = s.getContext('2d'); sx.drawImage(img, 0, 0, 8, 8);
      const px = sx.getImageData(0, 0, 8, 8).data, g = []; for (let i = 0; i < 64; i++) g.push((px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3);
      const avg = g.reduce((a, b) => a + b, 0) / 64; let hex = ''; for (let i = 0; i < 64; i += 4) { let v = 0; for (let j = 0; j < 4; j++) v = (v << 1) | (g[i + j] > avg ? 1 : 0); hex += v.toString(16); }
      const bar = Math.max(34, Math.round(w * 0.06)); x.fillStyle = 'rgba(11,31,58,.82)'; x.fillRect(0, h - bar, w, bar);
      x.fillStyle = '#E6C674'; x.font = '700 ' + Math.round(bar * 0.34) + 'px Inter, sans-serif';
      const p = holder && holder.gps;
      x.fillText('CE DUTY · ' + label, 10, h - Math.round(bar * 0.56));
      x.fillStyle = '#fff'; x.font = '500 ' + Math.round(bar * 0.28) + 'px Inter, sans-serif';
      x.fillText(new Date().toLocaleString('en-IN') + (p ? ' · ' + p.lat.toFixed(5) + ', ' + p.lng.toFixed(5) : ' · NO GPS'), 10, h - Math.round(bar * 0.16));
      URL.revokeObjectURL(img.src); res({ data: c.toDataURL('image/jpeg', 0.7), hash: hex });
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}
function camInput(id, front) { return `<input type="file" id="${id}" accept="image/*" capture="${front ? 'user' : 'environment'}" hidden>`; }
function bindShot(shotEl, inputId, label, holder, key, onDone) {
  const inp = $(inputId);
  shotEl.onclick = () => inp.click();
  inp.onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.lastModified && Date.now() - f.lastModified > 3 * 60 * 1000) { toast('⚠️ पुरानी फ़ोटो नहीं चलेगी — अभी कैमरा से नई फ़ोटो लें', 4500); return; }
    try { const r = await snap(f, label(), holder); holder[key] = r.data; if (key === 'selfie') holder.hash = r.hash;
      shotEl.classList.add('done'); const old = shotEl.querySelector('img'); if (old) old.remove(); const im = new Image(); im.src = r.data; shotEl.appendChild(im); onDone && onDone();
    } catch (err) { toast('फ़ोटो नहीं ली जा सकी'); }
  };
}
async function send(action, payload, okFn, label) {
  try {
    if (!navigator.onLine) throw new TypeError('offline');
    const r = await api(action, payload); okFn(r, false);
  } catch (e) {
    if (e instanceof TypeError || !navigator.onLine) { payload.queued = true; await Q.add({ action, payload, at: Date.now() }); refreshQueueBar(); okFn({}, true); }
    else { toast(e.message, 5000); throw e; }
  }
}
function pickWorker(id, list, sel, withAll) {
  return `<select id="${id}">${withAll ? '<option value="">सभी मज़दूर</option>' : '<option value="">— मज़दूर चुनें —</option>'}${list.map(w => `<option value="${esc(w.id)}" ${w.id === sel ? 'selected' : ''}>${esc(w.name)} · ${esc(ROLE_HI[w.role] || w.role)} · ${esc(w.site)}${w.active ? '' : ' (बंद)'}</option>`).join('')}</select>`;
}

// ═══════════════ 🟢 DUTY — worker check-in / check-out ═══════════════
const D = {};
routes.duty = async function (p) {
  if (!can('duty') && !can('labourManage')) return go('home');
  spinner();
  const m = await meta(true);
  const forW = p.w && can('labourManage') ? (m.workers || []).find(w => w.id === p.w) : null;
  const me = forW || m.me;
  if (!me) { $app.innerHTML = `<div class="card center">👷<br><b>आपका नाम अभी मज़दूर लिस्ट में नहीं है</b><div class="small muted" style="margin-top:6px">मुनीम/ऑफ़िस से "मज़दूर जोड़ें" में अपना मोबाइल नंबर डलवाएँ।</div>${can('labourManage') ? '<a class="btn block" style="margin-top:14px" href="#labour">👷 लेबर स्क्रीन</a>' : ''}</div>`; return; }
  const localOpen = store.get('dutyOpen', null);
  const open = forW ? null : (m.open || (localOpen && localOpen.workerId === me.id && Date.now() - localOpen.at < 20 * 36e5 ? localOpen : null));
  Object.keys(D).forEach(k => delete D[k]);
  if (open) return dutyOutView(me, open);
  const hr = new Date().getHours(), defShift = hr >= 18 || hr < 5 ? 'NIGHT' : 'DAY';
  D.shift = defShift; D.challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const sites = m.sites || [], mySite = me.site || (sites[0] || {}).code;
  $app.innerHTML = `
  <div class="card hello"><div class="eyebrow">ड्यूटी शुरू · Check-in</div><div class="mid" style="margin-top:4px">👷 ${esc(me.name)}</div><div class="muted small">${esc(ROLE_HI[me.role] || me.role || '')} · ${new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div>
  <div class="card">
    <div class="sec"><b>1</b>साइट और शिफ़्ट</div>
    <label>साइट</label><select id="dSite">${sites.map(s => `<option value="${esc(s.code)}" ${s.code === mySite ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>
    <label>शिफ़्ट</label><div class="seg" id="dShift"><span data-v="DAY" class="${defShift === 'DAY' ? 'on' : ''}">☀️ दिन</span><span data-v="NIGHT" class="${defShift === 'NIGHT' ? 'on' : ''}">🌙 रात</span></div>
  </div>
  <div class="card">
    <div class="sec"><b>2</b>मशीन / गाड़ी</div>
    <select id="dVeh"></select>
    <div id="dVehBox" hidden>
      <label id="dMtrL">मीटर रीडिंग</label><input id="dMtr" type="number" inputmode="decimal" placeholder="मशीन पर जो रीडिंग दिख रही है">
      <label>मशीन चालू करने से पहले जाँच</label>
      <label class="chk"><input type="checkbox" value="oil"> 🛢️ इंजन ऑयल / हाइड्रोलिक ठीक है</label>
      <label class="chk"><input type="checkbox" value="tyre"> 🛞 टायर / ट्रैक ठीक है</label>
      <label class="chk"><input type="checkbox" value="brake"> 🛑 ब्रेक / हॉर्न / लाइट ठीक है</label>
    </div>
  </div>
  <div class="card">
    <div class="sec"><b>3</b>फ़ोटो और लोकेशन</div>
    <div class="challenge">सेल्फ़ी में: ${esc(D.challenge)}</div>
    <div class="photos" style="grid-template-columns:1fr 1fr">
      <div class="shot" id="sSelf"><span class="tag r">ज़रूरी</span>🤳<br>अपनी सेल्फ़ी</div>
      <div class="shot" id="sMach"><span class="tag r" id="sMachTag">ज़रूरी</span>🚜<br>मशीन की फ़ोटो<br><small>नंबर दिखना चाहिए</small></div>
    </div>
    ${camInput('cSelf', true)}${camInput('cMach', false)}
    <label>लोकेशन</label><div class="gps wait" id="dGps"></div>
  </div>
  <button id="dGo" class="btn gold block" style="font-size:18px;padding:17px">✅ ड्यूटी शुरू करें</button>
  <a class="btn ghost block" style="margin-top:10px" href="#labevent?type=LEAVE">🗓️ आज छुट्टी चाहिए</a>`;
  const vehOpts = () => {
    const vs = (m.vehicles || []).filter(v => v.site === val('dSite'));
    $('dVeh').innerHTML = '<option value="">— मशीन/गाड़ी चुनें —</option>' + vs.map(v => `<option value="${esc(v.no)}" data-m="${v.meter}">${esc(v.no)}${v.type ? ' · ' + esc(v.type) : ''}</option>`).join('') + '<option value="-">बिना मशीन (हेल्पर / अन्य काम)</option>';
    vehChange();
  };
  const vehChange = () => {
    const v = val('dVeh'), has = v && v !== '-'; $('dVehBox').hidden = !has; $('sMachTag').textContent = has ? 'ज़रूरी' : 'वैकल्पिक';
    const o = $('dVeh').selectedOptions[0]; $('dMtrL').textContent = o && o.dataset.m === 'HR' ? 'घंटा मीटर (HMR) रीडिंग' : 'ओडोमीटर (KM) रीडिंग';
  };
  $('dSite').onchange = vehOpts; $('dVeh').onchange = vehChange; vehOpts();
  document.querySelectorAll('#dShift span').forEach(s => s.onclick = () => { D.shift = s.dataset.v; document.querySelectorAll('#dShift span').forEach(x => x.classList.toggle('on', x === s)); });
  document.querySelectorAll('.chk input').forEach(c => c.onchange = () => c.parentElement.classList.toggle('on', c.checked));
  const lbl = () => me.name + ' · ' + (val('dVeh') && val('dVeh') !== '-' ? val('dVeh') : '') + ' · ' + D.challenge.replace(/^\S+\s/, '');
  bindShot($('sSelf'), 'cSelf', lbl, D, 'selfie'); bindShot($('sMach'), 'cMach', lbl, D, 'machine');
  gpsBox('dGps', D);
  $('dGo').onclick = async () => {
    const veh = val('dVeh'), has = veh && veh !== '-';
    if (!veh) return toast('मशीन/गाड़ी चुनें (या "बिना मशीन")');
    const checks = [...document.querySelectorAll('.chk input:checked')].map(c => c.value);
    if (has && val('dMtr') === '') return toast('मीटर रीडिंग डालें');
    if (has && checks.length < 3) return toast('तीनों जाँच पर ✓ लगाएँ');
    if (!D.selfie) return toast('सेल्फ़ी लें');
    if (has && !D.machine) return toast('मशीन की फ़ोटो लें');
    if (!D.gps && !confirm('लोकेशन नहीं मिली। फिर भी भेजें? (हाज़िरी जाँच में जाएगी)')) return;
    const pl = { workerId: forW ? forW.id : '', site: val('dSite'), shift: D.shift, vehicle: has ? veh : '', meter: has ? val('dMtr') : '', checklist: checks.join(','), challenge: D.challenge, selfie: D.selfie, machine: D.machine || '', imgHash: D.hash || '',
      lat: D.gps ? D.gps.lat : '', lng: D.gps ? D.gps.lng : '', acc: D.gps ? D.gps.acc : '', deviceId: forW ? '' : deviceId, phoneTs: new Date().toISOString(), clientId: 'A' + Date.now() + Math.random().toString(36).slice(2, 6) };
    const b = $('dGo'); b.disabled = true; b.textContent = 'भेजा जा रहा है…';
    try {
      await send('dutyIn', pl, (r, queued) => {
        if (!forW) store.set('dutyOpen', { workerId: me.id, at: Date.now(), inTs: new Date().toISOString(), vehicle: pl.vehicle, site: pl.site, shift: pl.shift, id: r.id || '' });
        META = null; store.del('labMeta');
        $app.innerHTML = `<div class="card duty-hero"><div class="tick">✓</div><h2 style="margin:0">${queued ? 'हाज़िरी फ़ोन में सुरक्षित' : 'ड्यूटी शुरू हो गई'}</h2>
          <p class="muted">${queued ? 'नेटवर्क आते ही अपने-आप चली जाएगी।' : esc(r.time || '')}</p>
          <div class="idbox"><small>${esc(me.name)}</small><strong>${esc(pl.vehicle || 'बिना मशीन')} · ${pl.shift === 'NIGHT' ? '🌙 रात' : '☀️ दिन'}</strong></div>
          <p class="small muted">शाम को ड्यूटी ख़त्म करते समय फिर से ऐप खोलकर "ड्यूटी ख़त्म" दबाएँ।</p>
          <a class="btn ghost block" href="#home">होम</a></div>`;
      });
    } catch (e) { b.disabled = false; b.textContent = '✅ ड्यूटी शुरू करें'; }
  };
};
function dutyOutView(me, open) {
  const since = open.inTs ? new Date(String(open.inTs).length > 19 ? open.inTs : open.inTs + '+05:30') : new Date(open.at);
  const hrs = Math.max(0, (Date.now() - since.getTime()) / 36e5);
  const veh = open.vehicle || '';
  const vm = ((META && META.vehicles) || []).find(v => v.no === veh);
  $app.innerHTML = `
  <div class="card duty-hero"><div class="eyebrow" style="color:var(--gold)">ड्यूटी चालू है</div><div class="big">${Math.floor(hrs)} घंटे ${Math.round((hrs % 1) * 60)} मिनट</div>
    <div class="since">शुरू: ${since.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })} · ${esc(veh || 'बिना मशीन')} · ${open.shift === 'NIGHT' ? '🌙 रात' : '☀️ दिन'}</div></div>
  <div class="card">
    <div class="sec"><b>1</b>ड्यूटी ख़त्म · Check-out</div>
    ${veh ? `<label>${vm && vm.meter === 'HR' ? 'घंटा मीटर (HMR)' : 'ओडोमीटर (KM)'} — अभी की रीडिंग</label><input id="oMtr" type="number" inputmode="decimal" placeholder="शुरू में: ${esc(open.inMeter || '')}">` : ''}
    <div class="photos" style="grid-template-columns:1fr;margin-top:10px"><div class="shot" id="oSelf"><span class="tag r">ज़रूरी</span>🤳<br>छुट्टी के समय की सेल्फ़ी</div></div>${camInput('oCam', true)}
    <label>लोकेशन</label><div class="gps wait" id="oGps"></div>
    <label>कोई बात (वैकल्पिक)</label><input id="oRem" placeholder="जैसे: मशीन में आवाज़ आ रही है">
  </div>
  <button id="oGo" class="btn block" style="font-size:18px;padding:17px">🏁 ड्यूटी ख़त्म करें</button>
  <a class="btn danger block" style="margin-top:10px" href="#labevent?type=BREAKDOWN&veh=${encodeURIComponent(veh)}">🔧 मशीन ख़राब है — रिपोर्ट करें</a>`;
  bindShot($('oSelf'), 'oCam', () => me.name + ' · OUT · ' + veh, D, 'selfie');
  gpsBox('oGps', D);
  $('oGo').onclick = async () => {
    if (veh && val('oMtr') === '') return toast('मीटर रीडिंग डालें');
    if (veh && open.inMeter !== undefined && open.inMeter !== '' && Number(val('oMtr')) < Number(open.inMeter) && !confirm('रीडिंग शुरू वाली से कम है। सही है?')) return;
    if (!D.selfie) return toast('सेल्फ़ी लें');
    const pl = { id: open.id || '', meter: veh ? val('oMtr') : '', selfie: D.selfie, lat: D.gps ? D.gps.lat : '', lng: D.gps ? D.gps.lng : '', remarks: val('oRem'), phoneTs: new Date().toISOString() };
    const b = $('oGo'); b.disabled = true; b.textContent = 'भेजा जा रहा है…';
    try {
      await send('dutyOut', pl, (r, queued) => {
        store.del('dutyOpen'); META = null; store.del('labMeta');
        $app.innerHTML = `<div class="card duty-hero"><div class="tick">✓</div><h2 style="margin:0">${queued ? 'फ़ोन में सुरक्षित' : 'ड्यूटी ख़त्म — धन्यवाद 🙏'}</h2>
          ${queued ? '<p class="muted">नेटवर्क आते ही अपने-आप चली जाएगी।</p>' : `<div class="kpis" style="text-align:left;margin-top:12px"><div class="kpi"><div class="l">काम के घंटे</div><div class="v">${n2(r.hours)}</div></div><div class="kpi gold"><div class="l">हाज़िरी</div><div class="v">${esc(ST_HI[r.status] || r.status)}</div></div>${Number(r.ot) ? `<div class="kpi"><div class="l">ओवरटाइम</div><div class="v">${n2(r.ot)} घं.</div></div>` : ''}${r.run !== '' && r.run !== undefined ? `<div class="kpi"><div class="l">मशीन चली</div><div class="v">${n2(r.run)}</div></div>` : ''}</div>
          <p class="small muted">${r.approved ? '✅ हाज़िरी मंज़ूर हो गई' : '⏳ मुनीम की जाँच के बाद मंज़ूर होगी'}</p>`}
          <a class="btn ghost block" href="#mywork">📒 मेरा हिसाब</a></div>`;
      });
    } catch (e) { b.disabled = false; b.textContent = '🏁 ड्यूटी ख़त्म करें'; }
  };
}

// ═══════════════ 📒 MY WORK — worker's own attendance & money ═══════════════
routes.mywork = async function (p) {
  spinner(); await meta().catch(() => {});
  const month = p.m || month0();
  const d = await api('myWork', { month });
  const w = d.worker, s = d.monthSum, tot = d.total;
  $app.innerHTML = `${letterhead('Wage slip · ' + w.name + ' · ' + month)}
  <div class="card hello"><div class="eyebrow">मेरा हिसाब · My account</div><div class="mid" style="margin-top:4px">👷 ${esc(w.name)}</div><div class="muted small">${esc(w.role)} · ${esc(siteName(w.site) || w.site)} · रोज़ ₹${esc(w.rate)}</div></div>
  <div class="row noprint" style="margin-bottom:10px"><input type="month" id="mm" value="${esc(month)}"><button class="btn sm ghost" id="mp" style="flex:0 0 auto">🖨️ पे-स्लिप</button></div>
  <div class="kpis">
    <div class="kpi gold"><div class="l">इस महीने के दिन</div><div class="v">${n2(s.days)}</div></div>
    <div class="kpi"><div class="l">इस महीने की कमाई</div><div class="v">${inr(s.earned)}</div></div>
    <div class="kpi in"><div class="l">इस महीने मिला</div><div class="v">${inr(s.paid + s.adv)}</div></div>
    <div class="kpi ${tot.net >= 0 ? 'in' : 'out'}"><div class="l">${tot.net >= 0 ? 'कुल बाक़ी (आपको मिलना है)' : 'एडवांस बाक़ी (कटेगा)'}</div><div class="v">${inr(tot.net)}</div></div>
  </div>
  <div class="sumrow"><span>हाज़िर ${s.p}</span><span>आधा ${s.hd}</span><span>OT ${n2(s.ot)} घं.</span><span>भत्ता ${inr(s.bhatta)}</span>${s.ded ? `<span>कटौती ${inr(s.ded)}</span>` : ''}${s.pendingDays ? `<span>⏳ मंज़ूरी बाक़ी ${n2(s.pendingDays)} दिन</span>` : ''}</div>
  ${w.licenceExpiry ? `<div class="health ${w.licenceExpiry < today() ? 'bad' : 'ok'}"><span class="dot"></span>ड्राइविंग लाइसेंस: ${fmtDate(w.licenceExpiry)} तक</div>` : ''}
  <h3>हाज़िरी</h3>
  <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>तारीख़</th><th>स्थिति</th><th>गाड़ी</th><th class="n">घंटे</th><th class="n">OT</th></tr></thead><tbody>
    ${d.att.map(a => `<tr><td class="nowrap">${fmtDate(a.date)}${a.shift === 'NIGHT' ? ' 🌙' : ''}</td><td>${stBadge(a.status + (a.approval === 'PENDING' && a.status !== 'ON' ? '?' : ''))} ${a.approval === 'REJ' ? '<span class="badge RED">अस्वीकार</span>' : ''}</td><td>${esc(a.vehicle)}</td><td class="n">${a.hours ? n2(a.hours) : ''}</td><td class="n">${Number(a.ot) ? n2(a.ot) : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="center muted">इस महीने कोई हाज़िरी नहीं</td></tr>'}
  </tbody></table></div></div>
  <h3>पैसे का लेन-देन</h3>
  <div class="card list">${d.txns.map(x => `<div class="item" style="cursor:default"><span class="ic">${x.type === 'DEDUCTION' ? '➖' : x.type === 'BHATTA' || x.type === 'BONUS' ? '➕' : '💵'}</span><div class="main"><div class="t">${esc(TX_HI[x.type] || x.type)} ${x.status === 'PENDING' ? '<span class="badge WATCH">मंज़ूरी बाक़ी</span>' : x.status === 'REJECTED' ? '<span class="badge RED">अस्वीकार</span>' : ''}</div><div class="s">${fmtDate(x.date)} · ${esc(x.mode || '')} ${esc(x.note || '')}</div></div><div class="amt">${inr(x.amount)}</div></div>`).join('') || '<div class="center muted">अभी कोई लेन-देन नहीं</div>'}</div>
  ${d.events.length ? `<h3>मेरी अर्ज़ी / रिपोर्ट</h3><div class="card list">${d.events.map(e => `<div class="item" style="cursor:default"><div class="main"><div class="t">${esc(EV_HI[e.type] || e.type)} <span class="badge ${e.status === 'OPEN' ? 'WATCH' : 'OK'}">${e.status === 'OPEN' ? 'खुला' : 'बंद'}</span></div><div class="s">${fmtDT(e.ts)} · ${esc(e.text)}${e.closeNote ? ' → ' + esc(e.closeNote) : ''}</div></div></div>`).join('')}</div>` : ''}
  <div class="row noprint" style="margin-top:12px"><a class="btn ghost" href="#labevent?type=LEAVE">🗓️ छुट्टी अर्ज़ी</a><a class="btn ghost" href="#labevent?type=COMPLAINT">📝 शिकायत</a></div>
  <div class="foot">गलती लगे तो मुनीम या ऑफ़िस से बात करें · System by <b>${esc(CFG.FIRM_NAME || '')}</b></div>`;
  $('mm').onchange = () => go('mywork?m=' + val('mm'));
  $('mp').onclick = () => window.print();
};

// ═══════════════ 📝 EVENT — breakdown / accident / leave / complaint ═══════════════
routes.labevent = async function (p) {
  const m = await meta().catch(() => META || {});
  const E = {}; let type = p.type || 'BREAKDOWN';
  const mgr = can('labourManage');
  $app.innerHTML = `<h2>📝 रिपोर्ट / अर्ज़ी</h2><div class="card">
    <label>किस बारे में?</label><div class="seg" id="eT">${Object.keys(EV_HI).map(k => `<span data-v="${k}" class="${k === type ? 'on' : ''}">${EV_HI[k]}</span>`).join('')}</div>
    ${mgr ? `<label>मज़दूर (वैकल्पिक)</label>${pickWorker('eW', (m.workers || []).filter(w => w.active), p.w || '')}` : ''}
    <label>मशीन / गाड़ी (वैकल्पिक)</label><select id="eV"><option value="">—</option>${(m.vehicles || []).map(v => `<option ${v.no === p.veh ? 'selected' : ''}>${esc(v.no)}</option>`).join('')}</select>
    <label>विवरण</label><textarea id="eX" rows="3" placeholder="क्या हुआ / कब से छुट्टी चाहिए / क्या शिकायत है"></textarea>
    <div class="photos" style="grid-template-columns:1fr;margin-top:10px"><div class="shot" id="eS"><span class="tag o">वैकल्पिक</span>📷<br>फ़ोटो</div></div>${camInput('eC', false)}
    <div style="height:12px"></div><button id="eGo" class="btn gold block">भेजें</button></div>`;
  document.querySelectorAll('#eT span').forEach(s => s.onclick = () => { type = s.dataset.v; document.querySelectorAll('#eT span').forEach(x => x.classList.toggle('on', x === s)); });
  bindShot($('eS'), 'eC', () => type + ' · ' + val('eV'), E, 'photo');
  $('eGo').onclick = async () => {
    if (!val('eX')) return toast('विवरण लिखें');
    const pl = { type, vehicle: val('eV'), text: val('eX'), photo: E.photo || '', workerId: val('eW') };
    try { await send('labourEvent', pl, (r, q) => { toast(q ? 'फ़ोन में सुरक्षित — नेटवर्क आने पर जाएगी' : '✅ भेज दिया गया'); history.back(); }); } catch (e) {}
  };
};

// ═══════════════ 👷 LABOUR HUB (munim / office / owner) ═══════════════
const TABS = [['today', '📍 आज'], ['verify', '✅ जाँच'], ['att', '📋 हाज़िरी'], ['muster', '🗓️ मस्टर रोल'], ['wages', '💰 वेतन'], ['dues', '⚖️ बकाया'], ['txns', '💵 भुगतान'], ['workers', '👥 मज़दूर'], ['machine', '🚜 मशीन–ऑपरेटर'], ['events', '🔧 मामले'], ['cost', '📈 लेबर ख़र्च'], ['joins', '🔁 आए / गए'], ['audit', '🕵️ ऑडिट']];
function tabs(cur) { return `<div class="ltabs">${TABS.filter(x => x[0] !== 'audit' || can('labourView')).map(x => `<a href="#labour?tab=${x[0]}" class="${x[0] === cur ? 'on' : ''}">${x[1]}</a>`).join('')}</div>`; }
function qs(o) { return Object.keys(o).filter(k => o[k] !== '' && o[k] !== undefined && o[k] !== null).map(k => k + '=' + encodeURIComponent(o[k])).join('&'); }
function filters(p, opts) {
  const m = META || {}, ws = (m.workers || []);
  const f = [];
  if (opts.month) f.push(`<div><label>महीना</label><input type="month" id="fMonth" value="${esc(p.month || month0())}"></div>`);
  if (opts.range) { f.push(`<div><label>से</label><input type="date" id="fFrom" value="${esc(p.from || month0() + '-01')}"></div>`); f.push(`<div><label>तक</label><input type="date" id="fTo" value="${esc(p.to || today())}"></div>`); }
  if ((m.sites || []).length > 1) f.push(`<div><label>साइट</label><select id="fSite"><option value="">सभी साइट</option>${m.sites.map(s => `<option value="${esc(s.code)}" ${s.code === p.site ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>`);
  if (opts.role) f.push(`<div><label>पद</label><select id="fRole"><option value="">सभी पद</option>${Object.keys(ROLE_HI).map(k => `<option value="${k}" ${k === p.role ? 'selected' : ''}>${ROLE_HI[k]}</option>`).join('')}</select></div>`);
  if (opts.worker) f.push(`<div><label>मज़दूर</label>${pickWorker('fWorker', ws, p.worker, true)}</div>`);
  if (opts.contractor && (m.contractors || []).length) f.push(`<div><label>ठेकेदार</label><select id="fCon"><option value="">सभी</option>${m.contractors.map(c => `<option ${c === p.contractor ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>`);
  if (opts.shift) f.push(`<div><label>शिफ़्ट</label><select id="fShift"><option value="">दोनों</option><option value="DAY" ${p.shift === 'DAY' ? 'selected' : ''}>☀️ दिन</option><option value="NIGHT" ${p.shift === 'NIGHT' ? 'selected' : ''}>🌙 रात</option></select></div>`);
  if (opts.vehicle) f.push(`<div><label>मशीन</label><select id="fVeh"><option value="">सभी</option>${(m.vehicles || []).map(v => `<option ${v.no === p.vehicle ? 'selected' : ''}>${esc(v.no)}</option>`).join('')}</select></div>`);
  if (opts.status) f.push(`<div><label>स्थिति</label><select id="fSt"><option value="">सभी</option>${['P', 'HD', 'A', 'L', 'WO', 'H', 'ON', 'LATE'].map(k => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${k === 'LATE' ? 'देर से आए' : ST_HI[k]}</option>`).join('')}</select></div>`);
  if (opts.approval) f.push(`<div><label>मंज़ूरी</label><select id="fAp"><option value="">सभी</option><option value="PENDING" ${p.approval === 'PENDING' ? 'selected' : ''}>⏳ बाक़ी</option><option value="OK" ${p.approval === 'OK' ? 'selected' : ''}>✅ मंज़ूर</option><option value="REJ" ${p.approval === 'REJ' ? 'selected' : ''}>❌ अस्वीकार</option></select></div>`);
  if (opts.risk) f.push(`<div><label>जोखिम</label><select id="fRisk"><option value="">सभी</option><option value="RED" ${p.risk === 'RED' ? 'selected' : ''}>🔴 संदिग्ध</option><option value="WATCH" ${p.risk === 'WATCH' ? 'selected' : ''}>🟠 जाँचें</option><option value="OK" ${p.risk === 'OK' ? 'selected' : ''}>🟢 साफ़</option></select></div>`);
  if (opts.source) f.push(`<div><label>किसने लगाई</label><select id="fSrc"><option value="">सभी</option><option value="SELF" ${p.source === 'SELF' ? 'selected' : ''}>🤳 ख़ुद (ऐप)</option><option value="MUNIM" ${p.source === 'MUNIM' ? 'selected' : ''}>✍️ मुनीम</option><option value="GROUP" ${p.source === 'GROUP' ? 'selected' : ''}>👥 ग्रुप फ़ोटो</option></select></div>`);
  if (opts.type) f.push(`<div><label>प्रकार</label><select id="fType"><option value="">सभी</option>${Object.keys(opts.type).map(k => `<option value="${k}" ${k === p.type ? 'selected' : ''}>${opts.type[k]}</option>`).join('')}</select></div>`);
  if (opts.minBal) f.push(`<div><label>दिखाएँ</label><select id="fMin"><option value="">सभी बकाया</option><option value="1" ${p.minBal === '1' ? 'selected' : ''}>जिन्हें पैसा देना है</option><option value="-1" ${p.minBal === '-1' ? 'selected' : ''}>जिन पर एडवांस बाक़ी</option></select></div>`);
  if (opts.active) f.push(`<div><label>खाता</label><select id="fAct"><option value="">सभी</option><option value="Y" ${p.active === 'Y' ? 'selected' : ''}>चालू</option><option value="N" ${p.active === 'N' ? 'selected' : ''}>बंद / छोड़ गए</option></select></div>`);
  if (opts.q) f.push(`<div style="grid-column:1/-1"><label>नाम / मोबाइल से खोजें</label><input id="fQ" value="${esc(p.q || '')}" placeholder="खोजें"></div>`);
  return `<details class="card noprint" ${opts.open ? 'open' : ''} style="padding:12px 14px"><summary style="font-weight:700;cursor:pointer">🔍 फ़िल्टर</summary><div class="filt">${f.join('')}</div><div class="row" style="margin-top:10px"><button class="btn sm" id="fGo">लागू करें</button><button class="btn sm ghost" id="fClr">साफ़ करें</button></div></details>`;
}
function readFilters(tab) {
  return { tab, month: val('fMonth'), from: val('fFrom'), to: val('fTo'), site: val('fSite'), role: val('fRole'), worker: val('fWorker'), contractor: val('fCon'), shift: val('fShift'), vehicle: val('fVeh'), status: val('fSt'), approval: val('fAp'), risk: val('fRisk'), source: val('fSrc'), type: val('fType'), minBal: val('fMin'), active: val('fAct'), q: val('fQ') };
}
function bindFilters(tab) {
  if ($('fGo')) $('fGo').onclick = () => go('labour?' + qs(readFilters(tab)));
  if ($('fClr')) $('fClr').onclick = () => go('labour?tab=' + tab);
}
function toolbar(extra) { return `<div class="row noprint" style="margin:6px 0 10px;flex-wrap:wrap">${extra || ''}<button class="btn sm ghost" id="tPrint" style="flex:0 0 auto">🖨️ प्रिंट / PDF</button><button class="btn sm ghost" id="tCsv" style="flex:0 0 auto">📊 Excel</button></div>`; }
function bindToolbar(csvFn) { if ($('tPrint')) $('tPrint').onclick = () => window.print(); if ($('tCsv')) $('tCsv').onclick = csvFn; }

routes.labour = async function (p) {
  if (!can('labourManage') && !can('labourView')) return go('home');
  spinner();
  await meta();
  const tab = p.tab || 'today';
  const head = `${tabs(tab)}`;
  const R = LAB[tab] || LAB.today;
  await R(p, head);
  lazyImgs();
};
const LAB = {};
const req = (p, extra) => Object.assign({ site: p.site, role: p.role, worker: p.worker, contractor: p.contractor, shift: p.shift, vehicle: p.vehicle, status: p.status, approval: p.approval, risk: p.risk, source: p.source, q: p.q, active: p.active, month: p.month, from: p.from, to: p.to }, extra || {});

// ── 📍 Today
LAB.today = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'today' }));
  const T = { total: 0, present: 0, onDuty: 0, flagged: 0, pending: 0, cost: 0, absent: 0 };
  d.sites.forEach(s => { T.total += s.total; T.present += s.present; T.onDuty += s.onDuty; T.flagged += s.flagged; T.pending += s.pending; T.cost += s.cost; T.absent += s.absent.length; });
  const showCost = can('labourView') || can('labourPay');
  $app.innerHTML = `${letterhead('Labour — Today ' + fmtDate(today()))}<h2>👷 लेबर · आज</h2>${head}
  <div class="row noprint" style="margin-bottom:12px;flex-wrap:wrap">
    ${can('duty') ? '<a class="btn gold sm" href="#duty" style="flex:1 1 140px">🤳 मेरी ड्यूटी</a>' : ''}
    ${can('labourManage') ? '<a class="btn sm" href="#labmark" style="flex:1 1 140px">✍️ हाज़िरी लगाएँ</a>' : ''}
    ${can('labourPay') ? '<a class="btn sm" href="#labpay" style="flex:1 1 140px">💵 भुगतान / एडवांस</a>' : ''}
    ${can('labourManage') || can('labourAdmin') ? '<a class="btn sm ghost" href="#labworker" style="flex:1 1 140px">➕ मज़दूर जोड़ें</a>' : ''}
  </div>
  <div class="kpis">
    <div class="kpi gold"><div class="l">आज हाज़िर</div><div class="v">${T.present} / ${T.total}</div></div>
    <div class="kpi" style="--c:#2563EB"><div class="l">अभी ड्यूटी पर</div><div class="v">${T.onDuty}</div></div>
    <div class="kpi out"><div class="l">नहीं आए</div><div class="v">${T.absent}</div></div>
    <a class="kpi" href="#labour?tab=verify" style="text-decoration:none;color:inherit;--c:#EA580C"><div class="l">जाँच बाक़ी · 🔴 ${T.flagged}</div><div class="v">${T.pending}</div></a>
    ${showCost ? `<div class="kpi" style="grid-column:1/-1"><div class="l">आज का लेबर ख़र्च (अनुमान)</div><div class="v">${inr(T.cost)}</div></div>` : ''}
  </div>
  ${d.pendingTxn.length ? `<h3>⏳ एडवांस / भुगतान — मंज़ूरी चाहिए</h3><div class="card list">${d.pendingTxn.map(x => `<div class="item" style="cursor:default"><span class="ic">💵</span><div class="main"><div class="t">${esc(x.name)} · ${esc(TX_HI[x.type])} ${inr(x.amount)}</div><div class="s">${fmtDate(x.date)} · ${esc(x.site)} · मुनीम: ${esc(x.by)} · कमाई बैलेंस: ${rs(x.balance)}${x.note ? ' · ' + esc(x.note) : ''}</div></div>${can('labourApprove') ? `<div class="right"><button class="btn sm" data-tx="${x.id}" data-d="OK">✅</button> <button class="btn sm danger" data-tx="${x.id}" data-d="NO">✖</button></div>` : ''}</div>`).join('')}</div>` : ''}
  ${d.sites.map(s => `<h3>${esc(s.name)} · ${s.present}/${s.total}</h3>
    <div class="card">
      <div class="sumrow"><span>🟢 ड्यूटी पर ${s.onDuty}</span><span>🔴 फ़्लैग ${s.flagged}</span><span>⏳ जाँच ${s.pending}</span>${showCost ? `<span>💰 ${inr(s.cost)}</span>` : ''}<span>🚜 चालू ${s.machines.length}</span></div>
      ${s.absent.length ? `<div class="small" style="margin-top:6px"><b>नहीं आए (${s.absent.length}):</b> ${s.absent.map(a => esc(a.name)).join(', ')}</div><button class="btn sm wa noprint" style="margin-top:8px" data-wa="${esc(s.code)}">WhatsApp पर भेजें</button>` : '<div class="small" style="color:var(--green)">✅ सब आए हैं</div>'}
      ${s.idle.length ? `<div class="small" style="margin-top:8px"><b>🚜 खड़ी मशीनें:</b> ${s.idle.map(esc).join(', ')}</div>` : ''}
      ${s.machines.length ? `<div class="small muted" style="margin-top:6px">${s.machines.map(m => esc(m.vehicle) + ' → ' + esc(m.operator)).join(' · ')}</div>` : ''}
    </div>`).join('')}
  ${d.absent3.length ? `<h3>⚠️ 3 दिन से ग़ायब</h3><div class="card small">${d.absent3.map(a => `${esc(a.name)} (${esc(a.site)}) ${a.mobile ? `<a href="tel:${esc(a.mobile)}">📞</a>` : ''}`).join(' · ')}</div>` : ''}
  ${d.licence.length ? `<h3>🪪 लाइसेंस एक्सपायरी</h3><div class="card small">${d.licence.map(l => `<span class="badge ${l.expired ? 'RED' : 'WATCH'}">${esc(l.name)} · ${fmtDate(l.expiry)}</span>`).join(' ')}</div>` : ''}
  ${d.events.length ? `<h3>🔧 खुले मामले</h3><div class="card list">${d.events.map(e => `<div class="item" style="cursor:default"><div class="main"><div class="t">${esc(EV_HI[e.type] || e.type)} ${esc(e.vehicle)} ${e.name ? '· ' + esc(e.name) : ''}</div><div class="s">${fmtDT(e.ts)} · ${esc(e.site)} · ${esc(e.text)}</div>${e.photo ? `<a data-ph="${e.photo}" class="small">📷 फ़ोटो</a>` : ''}</div><button class="btn sm ghost" data-ev="${e.id}">बंद करें</button></div>`).join('')}</div>` : ''}
  <h3>आज की हाज़िरी (${d.rows.length})</h3>
  <div class="card list">${d.rows.map(a => `<div class="item" style="cursor:default"><span class="ic">${stBadge(a.status)}</span><div class="main"><div class="t">${esc(a.name)} ${riskBadge(a.risk)}</div><div class="s">${esc(a.vehicle || 'बिना मशीन')} · ${a.inTs ? fmtDT(a.inTs).slice(11) : ''}${a.outTs ? ' → ' + fmtDT(a.outTs).slice(11) : ''} ${a.shift === 'NIGHT' ? '🌙' : ''} · ${esc(a.source === 'SELF' ? '🤳' : a.source === 'GROUP' ? '👥' : '✍️')}</div>${a.flags.length ? `<div class="s" style="color:var(--red)">${a.flags.map(esc).join(' · ')}</div>` : ''}</div></div>`).join('') || '<div class="center muted">आज अभी कोई हाज़िरी नहीं</div>'}</div>
  <div class="foot">${esc(d.generated)}</div>`;
  document.querySelectorAll('[data-wa]').forEach(b => b.onclick = () => { const s = d.sites.find(x => x.code === b.dataset.wa); const msg = `*👷 ${s.name} — ${fmtDate(today())}*\nहाज़िर: ${s.present}/${s.total}\n\n*नहीं आए:*\n${s.absent.map((a, i) => (i + 1) + '. ' + a.name + (a.mobile ? ' (' + a.mobile + ')' : '')).join('\n')}${s.idle.length ? '\n\n*खड़ी मशीनें:* ' + s.idle.join(', ') : ''}`; window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank'); });
  document.querySelectorAll('[data-tx]').forEach(b => b.onclick = async () => { try { await api('labourTxnDecide', { id: b.dataset.tx, decision: b.dataset.d }); toast('✅'); render(); } catch (e) { toast(e.message); } });
  document.querySelectorAll('[data-ev]').forEach(b => b.onclick = async () => { const note = prompt('क्या किया गया? (बंद करने का नोट)'); if (note === null) return; try { await api('labourEventClose', { id: b.dataset.ev, note }); toast('✅'); render(); } catch (e) { toast(e.message); } });
  document.querySelectorAll('[data-ph]').forEach(a => a.onclick = () => openFile(a.dataset.ph, 'open'));
};

// ── ✅ Verify (side-by-side photos, one-tap approve)
LAB.verify = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'verify', from: p.from || '2000-01-01' }));
  const rows = d.rows.slice(0, 40);
  $app.innerHTML = `<h2>✅ हाज़िरी जाँच</h2>${head}
  ${filters(p, { range: true, role: true, worker: true, risk: true, shift: true })}
  <div class="health ${d.total ? 'warn' : 'ok'}"><span class="dot"></span>${d.total ? d.total + ' हाज़िरी जाँच के लिए बाक़ी' + (d.total > 40 ? ' (पहले 40 दिख रही हैं)' : '') : 'सब जाँच हो चुकी ✅'}</div>
  ${rows.length ? `<div class="row noprint" style="margin:8px 0"><button class="btn sm" id="vAllOk">✅ चुनी हुई सब मंज़ूर</button><label class="small" style="flex:0 0 auto;margin:0"><input type="checkbox" id="vAll"> सब चुनें</label></div>` : ''}
  ${rows.map(a => `<div class="card vcard ${a.risk}">
    <div class="row"><label style="flex:0 0 auto;margin:0"><input type="checkbox" class="vSel" value="${a.id}" ${a.risk === 'OK' ? 'checked' : ''}></label><div><b>${esc(a.name)}</b> <span class="mini">${esc(a.role)} · ${esc(siteName(a.site))}</span><div class="mini">${fmtDate(a.date)} ${a.shift === 'NIGHT' ? '🌙' : '☀️'} · ${esc(a.vehicle || 'बिना मशीन')} · ${a.inTs ? fmtDT(a.inTs).slice(11) : ''}${a.outTs ? ' → ' + fmtDT(a.outTs).slice(11) : ' (ड्यूटी चालू)'} ${a.hours ? '· ' + n2(a.hours) + ' घं.' : ''}</div></div><div style="flex:0 0 auto">${stBadge(a.status)} ${riskBadge(a.risk)}</div></div>
    ${a.flags.length ? `<ul class="small" style="color:var(--red);margin:6px 0 0;padding-left:18px">${a.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="thumbs"><figure data-img="${esc(a.regPhoto)}" data-cap="रजिस्टर फ़ोटो">${a.regPhoto ? '…' : 'फ़ोटो नहीं'}</figure><figure data-img="${esc(a.inSelfie)}" data-cap="आज · ${esc((a.challenge || '').replace(/^\S+\s/, ''))}">${a.inSelfie ? '…' : '—'}</figure><figure data-img="${esc(a.inMachine || a.groupPhoto)}" data-cap="मशीन">${a.inMachine || a.groupPhoto ? '…' : '—'}</figure></div>
    <div class="mini">${a.inMeter !== '' ? 'मीटर ' + esc(a.inMeter) + (a.outMeter !== '' ? ' → ' + esc(a.outMeter) : '') + ' · ' : ''}${a.inDist !== '' ? 'साइट से ' + esc(a.inDist) + ' km · ' : ''}${a.inAcc ? '±' + esc(a.inAcc) + 'm · ' : ''}${mapLink(a.inLat, a.inLng)}</div>
    <div class="row noprint" style="margin-top:10px"><button class="btn sm" data-ap="${a.id}" data-s="P">✅ पूरा दिन</button><button class="btn sm ghost" data-ap="${a.id}" data-s="HD">½ आधा</button><button class="btn sm danger" data-ap="${a.id}" data-s="REJ">✖ अस्वीकार</button></div>
  </div>`).join('')}`;
  bindFilters('verify');
  const act = async (ids, s, reason) => { try { await api('labourApprove', { ids, decision: s === 'REJ' ? 'REJ' : 'OK', status: s === 'REJ' ? '' : s, reason }); toast('✅ ' + ids.length); render(); } catch (e) { toast(e.message); } };
  document.querySelectorAll('[data-ap]').forEach(b => b.onclick = () => { const s = b.dataset.s; let reason = ''; if (s !== 'P') { reason = prompt(s === 'REJ' ? 'अस्वीकार का कारण' : 'आधा दिन क्यों?'); if (reason === null) return; } act([b.dataset.ap], s, reason); });
  if ($('vAll')) $('vAll').onchange = e => document.querySelectorAll('.vSel').forEach(c => c.checked = e.target.checked);
  if ($('vAllOk')) $('vAllOk').onclick = () => { const ids = [...document.querySelectorAll('.vSel:checked')].map(c => c.value); if (!ids.length) return toast('कोई नहीं चुना'); const red = rows.filter(r => ids.includes(r.id) && r.risk === 'RED').length; if (red && !confirm(red + ' संदिग्ध (🔴) हाज़िरी भी चुनी हैं। फिर भी सब मंज़ूर करें?')) return; act(ids, 'P', ''); };
};

// ── 📋 Attendance register (full filters)
LAB.att = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'att' }));
  const s = d.sum;
  $app.innerHTML = `${letterhead('Attendance register · ' + fmtDate(d.from) + ' to ' + fmtDate(d.to))}<h2>📋 हाज़िरी रजिस्टर</h2>${head}
  ${filters(p, { range: true, role: true, worker: true, contractor: true, shift: true, vehicle: true, status: true, approval: true, risk: true, source: true, open: false })}
  <div class="sumrow"><span>कुल ${d.total}</span><span>हाज़िर ${s.p}</span><span>आधा ${s.hd}</span><span>ग़ैरहाज़िर ${s.a}</span><span>छुट्टी ${s.l}</span><span>ड्यूटी पर ${s.on}</span><span>🔴 ${s.red}</span><span>🟠 ${s.watch}</span><span>⏳ ${s.pending}</span><span>घंटे ${n2(s.hours)}</span><span>OT ${n2(s.ot)}</span></div>
  ${toolbar()}
  <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>तारीख़</th><th>मज़दूर</th><th>साइट</th><th>मशीन</th><th>आया</th><th>गया</th><th class="n">घंटे</th><th class="n">OT</th><th>स्थिति</th><th>जाँच</th></tr></thead><tbody>
  ${d.rows.map(a => `<tr><td class="nowrap">${fmtDate(a.date)}${a.shift === 'NIGHT' ? ' 🌙' : ''}</td><td><b>${esc(a.name)}</b><div class="mini">${esc(a.role)} · ${a.source === 'SELF' ? '🤳' : a.source === 'GROUP' ? '👥' : '✍️'}</div>${a.flags.length ? `<div class="mini" style="color:var(--red)">${a.flags.map(esc).join(', ')}</div>` : ''}${a.editReason ? `<div class="mini">✎ ${esc(a.editReason)}</div>` : ''}</td><td>${esc(a.site)}</td><td>${esc(a.vehicle)}</td><td class="nowrap">${a.inTs ? fmtDT(a.inTs).slice(11) : ''}</td><td class="nowrap">${a.outTs ? fmtDT(a.outTs).slice(11) : ''}</td><td class="n">${a.hours ? n2(a.hours) : ''}</td><td class="n">${Number(a.ot) ? n2(a.ot) : ''}</td><td>${stBadge(a.status)} ${riskBadge(a.risk)}</td><td>${a.approval === 'OK' ? '✅' : a.approval === 'REJ' ? '❌' : '⏳'}</td></tr>`).join('') || '<tr><td colspan="10" class="center muted">कोई रिकॉर्ड नहीं</td></tr>'}
  </tbody></table></div></div>`;
  bindFilters('att');
  bindToolbar(() => csv('Attendance_' + d.from + '_' + d.to, ['Date', 'Shift', 'Worker', 'Role', 'Site', 'Vehicle', 'In', 'Out', 'Hours', 'OT', 'Status', 'Risk', 'Flags', 'Approval', 'Source', 'Meter In', 'Meter Out', 'Edit note'],
    d.rows.map(a => [a.date, a.shift, a.name, a.role, a.site, a.vehicle, a.inTs, a.outTs, a.hours, a.ot, a.status, a.risk, a.flags.join(' | '), a.approval, a.source, a.inMeter, a.outMeter, a.editReason])));
};

// ── 🗓️ Muster roll
LAB.muster = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'muster', month: p.month || month0() }));
  const days = Array.from({ length: d.days }, (_, i) => i + 1);
  $app.innerHTML = `${letterhead('Muster roll · ' + d.month + (p.site ? ' · ' + siteName(p.site) : ''))}<h2>🗓️ मस्टर रोल · ${esc(d.month)}</h2>${head}
  ${filters(p, { month: true, role: true, contractor: true, active: true, q: true })}
  ${d.locked ? '<div class="health ok"><span class="dot"></span>🔒 यह महीना लॉक है — कोई बदलाव नहीं हो सकता</div>' : ''}
  ${toolbar(can('labourApprove') ? `<button class="btn sm ${d.locked ? 'ghost' : ''}" id="mLock" style="flex:0 0 auto">${d.locked ? '🔓 अनलॉक' : '🔒 महीना लॉक करें'}</button>` : '')}
  <div class="small muted noprint" style="margin-bottom:6px">P = हाज़िर · ½ = आधा · A = ग़ैरहाज़िर · L = छुट्टी · ? = मंज़ूरी बाक़ी</div>
  <div class="card" style="padding:0"><div class="tw"><table class="led mus"><thead><tr><th>मज़दूर</th>${days.map(x => `<th>${x}</th>`).join('')}<th>P</th><th>½</th><th>A</th><th>कुल</th><th>OT</th></tr></thead><tbody>
  ${d.rows.map(r => `<tr><td><a href="#labledger?w=${r.id}&month=${d.month}" style="text-decoration:none"><b>${esc(r.name)}</b></a><div class="mini">${esc(r.role)} · ${esc(r.site)}</div></td>${days.map(x => `<td>${r.days[x] ? r.days[x].split('/').map(stBadge).join('') : ''}</td>`).join('')}<td>${r.p}</td><td>${r.hd}</td><td>${r.a}</td><td><b>${n2(r.total)}</b>${r.pending ? `<div class="mini">⏳${n2(r.pending)}</div>` : ''}</td><td>${n2(r.ot)}</td></tr>`).join('') || `<tr><td colspan="${d.days + 6}" class="center muted">कोई रिकॉर्ड नहीं</td></tr>`}
  </tbody></table></div></div>`;
  bindFilters('muster');
  bindToolbar(() => csv('MusterRoll_' + d.month, ['Worker', 'Role', 'Site'].concat(days.map(String)).concat(['P', 'HD', 'A', 'Total days', 'OT hrs', 'Pending']), d.rows.map(r => [r.name, r.role, r.site].concat(days.map(x => r.days[x] || '')).concat([r.p, r.hd, r.a, r.total, r.ot, r.pending]))));
  if ($('mLock')) $('mLock').onclick = async () => { if (!confirm(d.locked ? 'महीना अनलॉक करें?' : d.month + ' लॉक करें? इसके बाद हाज़िरी/भुगतान नहीं बदलेंगे।')) return; try { await api('labourLock', { month: d.month, site: p.site || 'ALL', unlock: d.locked }); toast('✅'); render(); } catch (e) { toast(e.message); } };
};

// ── 💰 Wages register
LAB.wages = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'wages', month: p.from ? '' : (p.month || month0()) }));
  const R = d.showRate, t0 = d.tot;
  $app.innerHTML = `${letterhead('Wage register · ' + fmtDate(d.from) + ' to ' + fmtDate(d.to))}<h2>💰 वेतन रजिस्टर</h2>${head}
  ${filters(p, { month: !p.from, range: !!p.from, role: true, contractor: true, active: true, q: true })}
  <div class="small noprint" style="margin:-6px 0 8px"><a href="#labour?tab=wages&from=${month0()}-01&to=${today()}">तारीख़ से तारीख़ चुनें</a></div>
  ${R ? `<div class="kpis"><div class="kpi gold"><div class="l">कुल दिन</div><div class="v">${n2(t0.days)}</div></div><div class="kpi"><div class="l">कुल कमाई</div><div class="v">${inr(t0.earned)}</div></div><div class="kpi in"><div class="l">दिया (भुगतान + एडवांस)</div><div class="v">${inr(t0.paid + t0.adv)}</div></div><div class="kpi ${t0.balance >= 0 ? '' : 'out'}"><div class="l">कुल बकाया (आज तक)</div><div class="v">${rs(t0.balance)}</div></div></div>` : ''}
  ${toolbar()}
  <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>मज़दूर</th><th class="n">P</th><th class="n">½</th><th class="n">दिन</th><th class="n">OT</th>${R ? '<th class="n">रेट</th><th class="n">वेतन</th><th class="n">OT ₹</th><th class="n">भत्ता+इनाम</th><th class="n">कटौती</th><th class="n">कमाई</th><th class="n">दिया</th><th class="n">इस अवधि का बाक़ी</th>' : ''}<th class="n">कुल बकाया</th></tr></thead><tbody>
  ${d.rows.map(r => `<tr><td><a href="#labledger?w=${r.id}&from=${d.from}&to=${d.to}" style="text-decoration:none"><b>${esc(r.name)}</b></a><div class="mini">${esc(r.role)} · ${esc(r.site)}${r.pendingDays ? ' · ⏳' + n2(r.pendingDays) : ''}</div></td><td class="n">${r.p}</td><td class="n">${r.hd}</td><td class="n"><b>${n2(r.days)}</b></td><td class="n">${n2(r.ot)}</td>
    ${R ? `<td class="n">${n2(r.rate)}</td><td class="n">${n2(r.wages)}</td><td class="n">${n2(r.otAmt)}</td><td class="n">${n2(r.bhatta + r.bonus)}</td><td class="n">${n2(r.ded)}</td><td class="n"><b>${n2(r.earned)}</b></td><td class="n">${n2(r.paid + r.adv)}</td><td class="n">${rs(r.net)}</td>` : ''}<td class="n"><b style="color:${r.balance >= 0 ? 'var(--green)' : 'var(--red)'}">${rs(r.balance)}</b></td></tr>`).join('') || '<tr><td colspan="14" class="center muted">कोई रिकॉर्ड नहीं</td></tr>'}
  </tbody></table></div></div>
  <p class="small muted">वेतन = मंज़ूर हाज़िरी × उस दिन का रेट। ⏳ = मंज़ूरी बाक़ी दिन (अभी कमाई में नहीं जुड़े)।</p>`;
  bindFilters('wages');
  bindToolbar(() => csv('Wages_' + d.from + '_' + d.to, ['Worker', 'Role', 'Site', 'Mobile', 'UPI', 'Bank', 'P', 'HD', 'Days', 'OT hrs', 'Rate', 'Wages', 'OT amt', 'Bhatta', 'Bonus', 'Deduction', 'Earned', 'Paid', 'Advance', 'Period balance', 'Total balance', 'Pending days'],
    d.rows.map(r => [r.name, r.role, r.site, r.mobile, r.upi, r.bank, r.p, r.hd, r.days, r.ot, r.rate, r.wages, r.otAmt, r.bhatta, r.bonus, r.ded, r.earned, r.paid, r.adv, r.net, r.balance, r.pendingDays])));
};

// ── ⚖️ Dues (who is owed / advance outstanding)
LAB.dues = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'dues', minBal: p.minBal }));
  const pos = d.rows.filter(r => r.balance > 0), neg = d.rows.filter(r => r.balance < 0);
  $app.innerHTML = `${letterhead('Dues & advances')}<h2>⚖️ बकाया और एडवांस</h2>${head}
  ${filters(p, { role: true, contractor: true, minBal: true, active: true, q: true })}
  <div class="kpis"><div class="kpi in"><div class="l">मज़दूरों को देना है (${pos.length})</div><div class="v">${inr(pos.reduce((s, r) => s + r.balance, 0))}</div></div><div class="kpi out"><div class="l">एडवांस बाहर (${neg.length})</div><div class="v">${inr(neg.reduce((s, r) => s + r.balance, 0))}</div></div></div>
  ${toolbar()}
  <div class="card list">${d.rows.sort((a, b) => b.balance - a.balance).map(r => `<a class="item" style="text-decoration:none;color:inherit" href="#labledger?w=${r.id}"><span class="ic">${r.balance >= 0 ? '🟢' : '🔴'}</span><div class="main"><div class="t">${esc(r.name)} ${r.active ? '' : '<span class="badge">छोड़ गया</span>'}</div><div class="s">${esc(r.role)} · ${esc(r.site)}${r.upi ? ' · UPI ' + esc(r.upi) : ''}</div></div><div class="amt" style="color:${r.balance >= 0 ? 'var(--green)' : 'var(--red)'}">${rs(r.balance)}</div></a>`).join('') || '<div class="center muted">कोई बकाया नहीं</div>'}</div>`;
  bindFilters('dues');
  bindToolbar(() => csv('Dues_' + today(), ['Worker', 'Role', 'Site', 'Mobile', 'UPI', 'Bank', 'Balance (+ to pay / − advance)'], d.rows.map(r => [r.name, r.role, r.site, r.mobile, r.upi, r.bank, r.balance])));
};

// ── 💵 Payments list
LAB.txns = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'txns', type: p.type, txStatus: p.txStatus }));
  $app.innerHTML = `${letterhead('Payments & advances · ' + fmtDate(d.from) + ' to ' + fmtDate(d.to))}<h2>💵 भुगतान / एडवांस / भत्ता</h2>${head}
  ${filters(p, { range: true, worker: true, role: true, type: TX_HI })}
  ${can('labourPay') ? '<a class="btn gold block noprint" href="#labpay" style="margin-bottom:10px">➕ नई एंट्री</a>' : ''}
  <div class="sumrow">${Object.keys(d.tot).map(k => `<span>${esc(TX_HI[k] || k)} ${inr(d.tot[k])}</span>`).join('')}</div>
  ${toolbar()}
  <div class="card list">${d.rows.map(x => `<div class="item" style="cursor:default"><span class="ic">${x.type === 'DEDUCTION' ? '➖' : x.type === 'BHATTA' || x.type === 'BONUS' ? '➕' : '💵'}</span><div class="main"><div class="t">${esc(x.name)} · ${esc(TX_HI[x.type])} ${x.status !== 'OK' ? `<span class="badge ${x.status === 'PENDING' ? 'WATCH' : 'RED'}">${x.status === 'PENDING' ? 'मंज़ूरी बाक़ी' : 'अस्वीकार'}</span>` : ''}</div><div class="s">${fmtDate(x.date)} · ${esc(x.site)} · ${esc(x.mode)} · ${esc(x.by)}${x.note ? ' · ' + esc(x.note) : ''} ${x.proof ? `<a data-ph="${x.proof}">🧾 सबूत</a>` : ''}</div></div><div class="amt">${inr(x.amount)}</div></div>`).join('') || '<div class="center muted">कोई एंट्री नहीं</div>'}</div>`;
  bindFilters('txns');
  document.querySelectorAll('[data-ph]').forEach(a => a.onclick = () => openFile(a.dataset.ph, 'open'));
  bindToolbar(() => csv('Payments_' + d.from + '_' + d.to, ['Date', 'Worker', 'Site', 'Type', 'Amount', 'Mode', 'Status', 'By', 'Note'], d.rows.map(x => [x.date, x.name, x.site, x.type, x.amount, x.mode, x.status, x.by, x.note])));
};

// ── 👥 Workers list
LAB.workers = async function (p, head) {
  const m = await meta(true); let ws = (m.workers || []).slice();
  if (p.site) ws = ws.filter(w => w.site === p.site); if (p.role) ws = ws.filter(w => w.role === p.role); if (p.contractor) ws = ws.filter(w => w.contractor === p.contractor);
  if (p.active === 'Y') ws = ws.filter(w => w.active); if (p.active === 'N') ws = ws.filter(w => !w.active);
  if (p.q) { const q = p.q.toLowerCase(); ws = ws.filter(w => (w.name + ' ' + w.mobile).toLowerCase().includes(q)); }
  const lic = w => w.licenceExpiry ? (w.licenceExpiry < today() ? '<span class="badge RED">लाइसेंस एक्सपायर</span>' : '') : '';
  $app.innerHTML = `${letterhead('Workers list')}<h2>👥 मज़दूर (${ws.length})</h2>${head}
  ${filters(p, { role: true, contractor: true, active: true, q: true, open: !!p.q })}
  <a class="btn gold block noprint" href="#labworker" style="margin-bottom:10px">➕ नया मज़दूर जोड़ें</a>
  ${toolbar()}
  <div class="card list">${ws.map(w => `<a class="item" style="text-decoration:none;color:inherit" href="#labworker?id=${w.id}"><span class="ic">${w.role === 'DRIVER' ? '🚚' : w.role === 'OPERATOR' ? '🚜' : w.role === 'MECHANIC' ? '🔧' : '👷'}</span><div class="main"><div class="t">${esc(w.name)} ${w.active ? '' : '⛔'} ${lic(w)}</div><div class="s">${esc(ROLE_HI[w.role] || w.role)} · ${esc(siteName(w.site))}${w.contractor ? ' · ठेकेदार: ' + esc(w.contractor) : ''}</div><div class="s">${w.mobile ? '📱 ' + esc(w.mobile) : ''} ${w.hasPhone ? '' : '· बिना फ़ोन'} ${w.rate ? '· ₹' + esc(w.rate) + '/दिन' : ''}</div></div></a>`).join('') || '<div class="center muted">कोई मज़दूर नहीं — ऊपर से जोड़ें</div>'}</div>`;
  bindFilters('workers');
  bindToolbar(() => csv('Workers_' + today(), ['Name', 'Mobile', 'Role', 'Site', 'Contractor', 'Rate', 'OT rate', 'Skills', 'Licence expiry', 'Join', 'Left', 'Active', 'Has phone'], ws.map(w => [w.name, w.mobile, w.role, w.site, w.contractor, w.rate, w.otRate, w.skills, w.licenceExpiry, w.joinDate, w.leftDate, w.active ? 'Y' : 'N', w.hasPhone ? 'Y' : 'N'])));
};

// ── 🚜 Machine–operator log
LAB.machine = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'machine' }));
  const byV = {}; d.rows.forEach(a => { const v = byV[a.vehicle] = byV[a.vehicle] || { shifts: 0, hours: 0, run: 0, ops: {} }; v.shifts++; v.hours += Number(a.hours) || 0; v.run += Number(a.meterRun) || 0; v.ops[a.name] = 1; });
  $app.innerHTML = `${letterhead('Machine–operator log · ' + fmtDate(d.from) + ' to ' + fmtDate(d.to))}<h2>🚜 मशीन–ऑपरेटर लॉग</h2>${head}
  ${filters(p, { range: true, vehicle: true, worker: true, shift: true })}
  <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>मशीन</th><th class="n">शिफ़्ट</th><th class="n">ड्यूटी घंटे</th><th class="n">मीटर चला</th><th>ऑपरेटर</th></tr></thead><tbody>${Object.keys(byV).map(k => `<tr><td><b>${esc(k)}</b></td><td class="n">${byV[k].shifts}</td><td class="n">${n2(byV[k].hours)}</td><td class="n">${n2(byV[k].run)}</td><td class="mini">${Object.keys(byV[k].ops).map(esc).join(', ')}</td></tr>`).join('') || '<tr><td colspan="5" class="center muted">कोई रिकॉर्ड नहीं</td></tr>'}</tbody></table></div></div>
  ${toolbar()}
  <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>तारीख़</th><th>मशीन</th><th>ऑपरेटर</th><th>आया–गया</th><th class="n">मीटर</th><th class="n">चला</th><th class="n">घंटे</th></tr></thead><tbody>
  ${d.rows.map(a => `<tr><td class="nowrap">${fmtDate(a.date)}${a.shift === 'NIGHT' ? ' 🌙' : ''}</td><td>${esc(a.vehicle)}</td><td>${esc(a.name)} ${riskBadge(a.risk)}</td><td class="nowrap">${a.inTs ? fmtDT(a.inTs).slice(11) : ''}–${a.outTs ? fmtDT(a.outTs).slice(11) : ''}</td><td class="n">${esc(a.inMeter)}${a.outMeter !== '' ? '→' + esc(a.outMeter) : ''}</td><td class="n">${a.meterRun !== '' ? n2(a.meterRun) : ''}</td><td class="n">${a.hours ? n2(a.hours) : ''}</td></tr>`).join('')}
  </tbody></table></div></div>`;
  bindFilters('machine');
  bindToolbar(() => csv('MachineLog_' + d.from + '_' + d.to, ['Date', 'Shift', 'Vehicle', 'Operator', 'In', 'Out', 'Meter in', 'Meter out', 'Run', 'Hours', 'Risk'], d.rows.map(a => [a.date, a.shift, a.vehicle, a.name, a.inTs, a.outTs, a.inMeter, a.outMeter, a.meterRun, a.hours, a.risk])));
};

// ── 🔧 Events
LAB.events = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'events', type: p.type }));
  $app.innerHTML = `<h2>🔧 मामले — ब्रेकडाउन / दुर्घटना / छुट्टी / शिकायत</h2>${head}
  ${filters(p, { range: true, type: EV_HI })}
  <a class="btn block noprint" href="#labevent" style="margin-bottom:10px">➕ नया मामला</a>
  <div class="card list">${d.rows.map(e => `<div class="item" style="cursor:default"><div class="main"><div class="t">${esc(EV_HI[e.type] || e.type)} ${esc(e.vehicle)} ${e.name ? '· ' + esc(e.name) : ''} <span class="badge ${e.status === 'OPEN' ? 'WATCH' : 'OK'}">${e.status === 'OPEN' ? 'खुला' : 'बंद'}</span></div><div class="s">${fmtDT(e.ts)} · ${esc(e.site)} · ${esc(e.by)} — ${esc(e.text)}</div>${e.closeNote ? `<div class="s">✔ ${esc(e.closedBy)}: ${esc(e.closeNote)}</div>` : ''}${e.photo ? `<a data-ph="${e.photo}" class="small">📷 फ़ोटो</a>` : ''}</div>${e.status === 'OPEN' ? `<button class="btn sm ghost" data-ev="${e.id}">बंद करें</button>` : ''}</div>`).join('') || '<div class="center muted">कोई मामला नहीं</div>'}</div>`;
  bindFilters('events');
  document.querySelectorAll('[data-ph]').forEach(a => a.onclick = () => openFile(a.dataset.ph, 'open'));
  document.querySelectorAll('[data-ev]').forEach(b => b.onclick = async () => { const note = prompt('क्या किया गया?'); if (note === null) return; try { await api('labourEventClose', { id: b.dataset.ev, note }); toast('✅'); render(); } catch (e) { toast(e.message); } });
};

// ── 📈 Cost by site
LAB.cost = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'cost' }));
  $app.innerHTML = `${letterhead('Labour cost by site · ' + fmtDate(d.from) + ' to ' + fmtDate(d.to))}<h2>📈 साइट-वार लेबर ख़र्च</h2>${head}
  ${filters(p, { range: true, role: true, contractor: true })}
  ${d.rows.map(s => `<div class="card"><div class="row"><div><b style="font-size:17px">${esc(s.name)}</b><div class="mini">${s.workers} मज़दूर · ${n2(s.manDays)} मैन-डे · OT ${n2(s.ot)} घं. · मशीन मीटर ${n2(s.machineHrs)}</div></div>${s.total !== undefined ? `<div class="right"><div class="big" style="font-size:22px">${inr(s.total)}</div><div class="mini">${inr(s.perDay)} / मैन-डे</div></div>` : ''}</div>
  ${s.wages !== undefined ? `<div class="sumrow"><span>वेतन ${inr(s.wages)}</span><span>OT ${inr(s.otAmt)}</span><span>भत्ता+इनाम ${inr(s.bhatta)}</span></div>` : ''}</div>`).join('') || '<div class="card center muted">कोई रिकॉर्ड नहीं</div>'}
  <p class="small muted">अगले चरण में यहाँ हर साइट का उत्पादन (ट्रिप/टन) जुड़ेगा — तब "प्रति ट्रिप / प्रति टन लेबर ख़र्च" भी दिखेगा।</p>`;
  bindFilters('cost');
};

// ── 🔁 Joined / left
LAB.joins = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'joins' }));
  $app.innerHTML = `<h2>🔁 नए आए / छोड़कर गए</h2>${head}${filters(p, { range: true, role: true })}
  <h3>नए आए (${d.joined.length})</h3><div class="card list">${d.joined.map(w => `<div class="item"><div class="main"><div class="t">${esc(w.name)}</div><div class="s">${esc(w.role)} · ${esc(w.site)} · ${fmtDate(w.date)}</div></div></div>`).join('') || '<div class="center muted">—</div>'}</div>
  <h3>छोड़कर गए (${d.left.length})</h3><div class="card list">${d.left.map(w => `<a class="item" style="text-decoration:none;color:inherit" href="#labledger?w=${w.id}"><div class="main"><div class="t">${esc(w.name)}</div><div class="s">${esc(w.role)} · ${esc(w.site)} · ${fmtDate(w.date)}</div></div><div class="amt" style="color:${w.balance >= 0 ? 'var(--green)' : 'var(--red)'}">फ़ाइनल ${rs(w.balance)}</div></a>`).join('') || '<div class="center muted">—</div>'}</div>`;
  bindFilters('joins');
};

// ── 🕵️ Audit
LAB.audit = async function (p, head) {
  const d = await api('labourData', req(p, { view: 'audit' }));
  const AH = { labMark: 'हाज़िरी लगाई/बदली', labApprove: 'मंज़ूरी', labPay: 'भुगतान', labTxnDecide: 'एडवांस मंज़ूरी', labSaveWorker: 'मज़दूर बदला', labResetDevice: 'फ़ोन रीसेट', labLock: 'महीना लॉक', labUnlock: 'महीना अनलॉक', labEventClose: 'मामला बंद' };
  $app.innerHTML = `${letterhead('Labour audit trail')}<h2>🕵️ ऑडिट — किसने क्या बदला</h2>${head}${filters(p, { range: true })}
  <div class="card list">${d.rows.map(a => `<div class="item" style="cursor:default"><div class="main"><div class="t">${esc(AH[a.action] || a.action)} · ${esc(a.userName)}</div><div class="s">${fmtDT(a.time)} · ${esc(a.detail)}</div></div></div>`).join('') || '<div class="center muted">—</div>'}</div>`;
  bindFilters('audit');
};

// ═══════════════ ✍️ MARK attendance (munim) ═══════════════
routes.labmark = async function (p) {
  if (!can('labourManage')) return go('home');
  spinner();
  const m = await meta(true), G = {};
  let status = 'P';
  const ws = (m.workers || []).filter(w => w.active);
  $app.innerHTML = `<h2>✍️ हाज़िरी लगाएँ (मुनीम)</h2>
  <div class="card">
    <div class="row"><div><label>तारीख़</label><input type="date" id="kD" value="${today()}" max="${today()}"></div><div><label>शिफ़्ट</label><select id="kS"><option value="DAY">☀️ दिन</option><option value="NIGHT">🌙 रात</option></select></div></div>
    ${(m.sites || []).length > 1 ? `<label>साइट</label><select id="kSite"><option value="">सभी</option>${m.sites.map(s => `<option value="${esc(s.code)}">${esc(s.name)}</option>`).join('')}</select>` : ''}
    <label>स्थिति</label><div class="seg" id="kSt">${['P', 'HD', 'A', 'L', 'WO', 'H'].map(k => `<span data-v="${k}" class="${k === 'P' ? 'on' : ''}">${ST_HI[k]}</span>`).join('')}</div>
    <div class="row"><div><label>मशीन (वैकल्पिक)</label><select id="kV"><option value="">—</option>${(m.vehicles || []).map(v => `<option>${esc(v.no)}</option>`).join('')}</select></div><div><label>OT घंटे</label><input id="kO" type="number" inputmode="decimal" placeholder="0"></div></div>
    <label>कारण / नोट (बदलाव करने पर ज़रूरी)</label><input id="kR" placeholder="जैसे: फ़ोन ख़राब था, ग्रुप फ़ोटो से हाज़िरी">
    <div class="photos" style="grid-template-columns:1fr;margin-top:10px"><div class="shot" id="kG"><span class="tag o">सलाह</span>👥<br>ग्रुप फ़ोटो</div></div>${camInput('kC', false)}
  </div>
  <div class="row" style="margin-bottom:8px"><input id="kQ" placeholder="🔍 नाम खोजें"><label class="small" style="flex:0 0 auto;margin:0"><input type="checkbox" id="kAll"> सब</label></div>
  <div class="card list wl" id="kL"></div>
  <button id="kGo" class="btn gold block" style="position:sticky;bottom:12px">✅ सेव करें</button>`;
  const list = () => { const q = val('kQ').toLowerCase(), site = val('kSite');
    $('kL').innerHTML = ws.filter(w => (!site || w.site === site) && (!q || w.name.toLowerCase().includes(q))).map(w => `<label class="item" style="cursor:pointer"><input type="checkbox" class="kW" value="${w.id}"><div class="main"><div class="t">${esc(w.name)}</div><div class="s">${esc(ROLE_HI[w.role] || w.role)} · ${esc(siteName(w.site))} ${w.hasPhone ? '' : '· बिना फ़ोन'}</div></div></label>`).join('') || '<div class="center muted">कोई मज़दूर नहीं</div>'; };
  list(); $('kQ').oninput = list; if ($('kSite')) $('kSite').onchange = list;
  $('kAll').onchange = e => document.querySelectorAll('.kW').forEach(c => c.checked = e.target.checked);
  document.querySelectorAll('#kSt span').forEach(s => s.onclick = () => { status = s.dataset.v; document.querySelectorAll('#kSt span').forEach(x => x.classList.toggle('on', x === s)); });
  G.gps = null; gps().then(x => G.gps = x);
  bindShot($('kG'), 'kC', () => 'GROUP · ' + val('kD'), G, 'photo');
  $('kGo').onclick = async () => {
    const ids = [...document.querySelectorAll('.kW:checked')].map(c => c.value);
    if (!ids.length) return toast('मज़दूर चुनें');
    const pl = { workerIds: ids, date: val('kD'), shift: val('kS'), status, vehicle: val('kV'), ot: val('kO'), reason: val('kR'), groupPhoto: G.photo || '' };
    try { await send('labourMark', pl, (r, q) => { toast(q ? 'फ़ोन में सुरक्षित' : `✅ ${r.added || 0} नई, ${r.updated || 0} बदली`); go('labour?tab=today'); }); } catch (e) {}
  };
};

// ═══════════════ 💵 PAY (payment / advance / bhatta / deduction) ═══════════════
routes.labpay = async function (p) {
  if (!can('labourPay')) return go('home');
  spinner();
  const m = await meta(true), P = {};
  let type = p.type || 'PAYMENT', mode = 'CASH';
  $app.innerHTML = `<h2>💵 पैसे की एंट्री</h2><div class="card">
    <label>मज़दूर</label>${pickWorker('pW', (m.workers || []), p.w || '')}
    <div id="pBal" class="calc" hidden><span>अभी का बैलेंस</span><strong id="pBalV">—</strong></div>
    <label>प्रकार</label><div class="seg" id="pT">${Object.keys(TX_HI).map(k => `<span data-v="${k}" class="${k === type ? 'on' : ''}">${TX_HI[k]}</span>`).join('')}</div>
    <div class="row"><div><label>राशि (₹)</label><input id="pA" type="number" inputmode="decimal" placeholder="0"></div><div><label>तारीख़</label><input id="pD" type="date" value="${today()}" max="${today()}"></div></div>
    <label>कैसे दिया</label><div class="seg" id="pM"><span data-v="CASH" class="on">💵 नकद</span><span data-v="UPI">📱 UPI</span><span data-v="BANK">🏦 बैंक</span></div>
    <label>नोट</label><input id="pN" placeholder="जैसे: नवंबर का वेतन / घर भेजने के लिए / 12 ट्रिप भत्ता">
    <div class="photos" style="grid-template-columns:1fr;margin-top:10px"><div class="shot" id="pS"><span class="tag o">सलाह</span>🧾<br>सबूत (UPI स्क्रीनशॉट / रसीद)</div></div><input type="file" id="pC" accept="image/*" hidden>
    <div style="height:12px"></div><button id="pGo" class="btn gold block">✅ सेव करें</button>
    <p class="small muted">कमाई से ज़्यादा एडवांस Owner की मंज़ूरी के लिए अपने-आप चला जाएगा।</p></div>`;
  const bal = async () => { const w = val('pW'); if (!w) { $('pBal').hidden = true; return; } try { const d = await api('labourData', { view: 'dues', worker: w }); const r = d.rows[0]; $('pBal').hidden = false; $('pBalV').textContent = r ? rs(r.balance) + (r.balance >= 0 ? ' (देना है)' : ' (एडवांस)') : '₹0'; } catch (e) { $('pBal').hidden = true; } };
  $('pW').onchange = bal; bal();
  document.querySelectorAll('#pT span').forEach(s => s.onclick = () => { type = s.dataset.v; document.querySelectorAll('#pT span').forEach(x => x.classList.toggle('on', x === s)); });
  document.querySelectorAll('#pM span').forEach(s => s.onclick = () => { mode = s.dataset.v; document.querySelectorAll('#pM span').forEach(x => x.classList.toggle('on', x === s)); });
  $('pS').onclick = () => $('pC').click();
  $('pC').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const r = await snap(f, type + ' ₹' + val('pA'), P); P.proof = r.data; $('pS').classList.add('done'); const im = new Image(); im.src = r.data; $('pS').appendChild(im); };
  $('pGo').onclick = async () => {
    if (!val('pW')) return toast('मज़दूर चुनें'); if (!(Number(val('pA')) > 0)) return toast('राशि डालें');
    const w = (m.workers || []).find(x => x.id === val('pW'));
    if (!confirm(`${w ? w.name : ''} · ${TX_HI[type]} ₹${val('pA')} (${mode}) — सेव करें?`)) return;
    const pl = { workerId: val('pW'), type, amount: val('pA'), date: val('pD'), mode, note: val('pN'), proof: P.proof || '', clientId: 'P' + Date.now() + Math.random().toString(36).slice(2, 6) };
    try { await send('labourPay', pl, (r, q) => { toast(q ? 'फ़ोन में सुरक्षित' : r.status === 'PENDING' ? '⏳ ' + r.message : '✅ सेव · बैलेंस ' + rs(r.balance), 5000); go('labledger?w=' + pl.workerId); }); } catch (e) {}
  };
};

// ═══════════════ 📒 WORKER LEDGER / STATEMENT ═══════════════
routes.labledger = async function (p) {
  if (!can('labourManage') && !can('labourView')) return go('home');
  spinner(); await meta();
  const from = p.from || (p.month ? p.month + '-01' : month0() + '-01'), to = p.to || (p.month ? p.month + '-31' : today());
  const d = await api('labourData', { view: 'ledger', worker: p.w, from, to });
  const w = d.worker, s = d.sum, R = w.rate !== '';
  $app.innerHTML = `${letterhead('Worker statement · ' + w.name + ' · ' + fmtDate(from) + ' to ' + fmtDate(to))}
  <div class="card hello"><div class="row"><figure class="noprint" data-img="${esc(w.photo)}" style="flex:0 0 64px;height:64px;margin:0;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.12);display:grid;place-items:center">👷</figure><div><div class="eyebrow">मज़दूर का खाता</div><div class="mid">${esc(w.name)}</div><div class="muted small">${esc(w.role)} · ${esc(siteName(w.site))} ${R ? '· ₹' + esc(w.rate) + '/दिन · OT ₹' + esc(w.otRate) + '/घं.' : ''}</div><div class="muted small">${w.mobile ? '📱 ' + esc(w.mobile) : ''} ${w.upi ? '· UPI ' + esc(w.upi) : ''}</div></div></div></div>
  <div class="row noprint" style="margin-bottom:10px;flex-wrap:wrap"><input type="date" id="lF" value="${from}" style="flex:1 1 130px"><input type="date" id="lT" value="${to}" style="flex:1 1 130px"><button class="btn sm" id="lGo" style="flex:0 0 auto">दिखाएँ</button></div>
  <div class="kpis">
    <div class="kpi gold"><div class="l">दिन (P ${s.p} · ½ ${s.hd})</div><div class="v">${n2(s.days)}</div></div>
    ${R ? `<div class="kpi"><div class="l">इस अवधि की कमाई</div><div class="v">${inr(s.earned)}</div></div><div class="kpi in"><div class="l">इस अवधि में दिया</div><div class="v">${inr(s.paid + s.adv)}</div></div>
    <div class="kpi ${d.closing >= 0 ? 'in' : 'out'}"><div class="l">${d.closing >= 0 ? 'बाक़ी — देना है' : 'एडवांस बाक़ी'}</div><div class="v">${rs(d.closing)}</div></div>` : ''}
  </div>
  <div class="row noprint" style="flex-wrap:wrap;margin-bottom:10px">
    ${can('labourPay') ? `<a class="btn sm gold" href="#labpay?w=${w.id}&type=PAYMENT">💵 भुगतान</a><a class="btn sm" href="#labpay?w=${w.id}&type=ADVANCE">एडवांस</a><a class="btn sm ghost" href="#labpay?w=${w.id}&type=BHATTA">➕ भत्ता</a><a class="btn sm ghost" href="#labpay?w=${w.id}&type=DEDUCTION">➖ कटौती</a>` : ''}
    <a class="btn sm ghost" href="#labworker?id=${w.id}">✏️ प्रोफ़ाइल</a><button class="btn sm ghost" id="lP">🖨️ पे-स्लिप</button>${R ? '<button class="btn sm wa" id="lW">WhatsApp</button>' : ''}
  </div>
  ${R ? `<div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>तारीख़</th><th>विवरण</th><th class="n">जमा (+)</th><th class="n">नाम (−)</th><th class="n">बैलेंस</th></tr></thead><tbody>
    <tr><td colspan="4"><b>पिछला बैलेंस</b></td><td class="n"><b>${rs(d.opening)}</b></td></tr>
    ${d.lines.map(l => `<tr style="${l.pending ? 'opacity:.6' : ''}"><td class="nowrap">${fmtDate(l.date)}</td><td>${esc(hiText(l.text))} ${l.proof ? `<a data-ph="${l.proof}">🧾</a>` : ''}</td><td class="n">${l.cr ? n2(l.cr) : ''}</td><td class="n">${l.dr ? n2(l.dr) : ''}</td><td class="n">${rs(l.bal)}</td></tr>`).join('')}
    <tr><td colspan="4"><b>अंतिम बैलेंस</b></td><td class="n"><b>${rs(d.closing)}</b></td></tr></tbody></table></div></div>` : `<div class="card list">${d.lines.map(l => `<div class="item"><div class="main"><div class="t">${fmtDate(l.date)}</div><div class="s">${esc(hiText(l.text))}</div></div></div>`).join('')}</div>`}
  ${d.rates.length > 1 ? `<p class="small muted">रेट इतिहास: ${d.rates.map(r => fmtDate(r.from) + ' से ₹' + r.rate).join(' · ')}</p>` : ''}
  <div class="print-only" style="margin-top:40px;display:none"><div class="row"><div>मज़दूर के हस्ताक्षर / अँगूठा</div><div class="right">मुनीम / अधिकृत हस्ताक्षर</div></div></div>`;
  $('lGo').onclick = () => go(`labledger?w=${w.id}&from=${val('lF')}&to=${val('lT')}`);
  $('lP').onclick = () => window.print();
  if ($('lW')) $('lW').onclick = () => { const msg = `*👷 ${w.name} — हिसाब*\n${fmtDate(from)} से ${fmtDate(to)}\nदिन: ${n2(s.days)} (P ${s.p}, ½ ${s.hd})${s.ot ? `\nOT: ${n2(s.ot)} घं.` : ''}\nकमाई: ₹${n2(s.earned)}\nदिया: ₹${n2(s.paid + s.adv)}\n*${d.closing >= 0 ? 'बाक़ी देना है' : 'एडवांस बाक़ी'}: ₹${n2(Math.abs(d.closing))}*\n— Choudhary Enterprises`; window.open('https://wa.me/' + (w.mobile ? '91' + w.mobile : '') + '?text=' + encodeURIComponent(msg), '_blank'); };
  document.querySelectorAll('[data-ph]').forEach(a => a.onclick = () => openFile(a.dataset.ph, 'open'));
  lazyImgs();
};

// ═══════════════ ➕ WORKER FORM ═══════════════
routes.labworker = async function (p) {
  if (!can('labourManage') && !can('labourAdmin')) return go('home');
  spinner();
  const m = await meta(true), Wp = {};
  const w = p.id ? (m.workers || []).find(x => x.id === p.id) || {} : { active: true, hasPhone: true, role: 'OPERATOR', site: (m.sites[0] || {}).code };
  const canRate = can('labourView') || can('labourAdmin') || !p.id;
  const types = [...new Set((m.vehicles || []).map(v => v.type).filter(Boolean))];
  const skills = String(w.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  $app.innerHTML = `<h2>${p.id ? '✏️ ' + esc(w.name) : '➕ नया मज़दूर'}</h2>
  <div class="card">
    <div class="photos" style="grid-template-columns:1fr 1fr"><div class="shot" id="wPh"><span class="tag r">ज़रूरी</span>🙂<br>चेहरे की फ़ोटो<br><small>हाज़िरी मिलान के लिए</small></div><div class="shot" id="wId"><span class="tag o">वैकल्पिक</span>🪪<br>पहचान पत्र</div></div>
    <input type="file" id="wPhC" accept="image/*" capture="user" hidden><input type="file" id="wIdC" accept="image/*" hidden>
    <label>नाम</label><input id="wN" value="${esc(w.name || '')}" placeholder="पूरा नाम">
    <div class="row"><div><label>मोबाइल</label><input id="wM" type="tel" inputmode="numeric" maxlength="10" value="${esc(w.mobile || '')}"></div><div><label>स्मार्टफ़ोन है?</label><select id="wHP"><option value="Y">हाँ</option><option value="N" ${w.hasPhone === false ? 'selected' : ''}>नहीं</option></select></div></div>
    <div class="row"><div><label>पद</label><select id="wR">${Object.keys(ROLE_HI).map(k => `<option value="${k}" ${k === w.role ? 'selected' : ''}>${ROLE_HI[k]}</option>`).join('')}</select></div><div><label>साइट</label><select id="wS">${(m.sites || []).map(s => `<option value="${esc(s.code)}" ${s.code === w.site ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div></div>
    ${canRate ? `<div class="row"><div><label>रोज़ का रेट (₹)</label><input id="wRt" type="number" inputmode="decimal" value="${esc(w.rate || '')}"></div><div><label>OT रेट (₹/घंटा)</label><input id="wOt" type="number" inputmode="decimal" value="${esc(w.otRate || '')}" placeholder="ख़ाली = रेट÷8"></div></div>
    ${p.id ? `<label>नया रेट किस तारीख़ से लागू?</label><input id="wRf" type="date" value="${today()}">` : ''}` : ''}
    <label>ठेकेदार (अगर ठेकेदार के ज़रिए है)</label><input id="wC" list="wCl" value="${esc(w.contractor || '')}"><datalist id="wCl">${(m.contractors || []).map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    ${types.length ? `<label>कौन-सी मशीन चला सकता है (स्किल)</label><div class="chips" id="wSk">${types.map(tp => `<span class="chip ${skills.includes(tp) ? 'on' : ''}" data-v="${esc(tp)}">${esc(tp)}</span>`).join('')}</div>` : ''}
    <div class="row"><div><label>ड्राइविंग लाइसेंस नंबर</label><input id="wLn" value="${esc(w.licenceNo || '')}"></div><div><label>लाइसेंस वैधता</label><input id="wLe" type="date" value="${esc(w.licenceExpiry || '')}"></div></div>
    <div class="row"><div><label>UPI आईडी</label><input id="wU" value="${esc(w.upi || '')}" placeholder="9xxxxxxxxx@upi"></div><div><label>बैंक खाता / IFSC</label><input id="wB" value="${esc(w.bank || '')}"></div></div>
    <div class="row"><div><label>घर का संपर्क नंबर</label><input id="wE" type="tel" value="${esc(w.emergency || '')}"></div><div><label>जुड़ने की तारीख़</label><input id="wJ" type="date" value="${esc(w.joinDate || today())}"></div></div>
    <label>पता</label><input id="wAd" value="${esc(w.address || '')}" placeholder="गाँव, ज़िला, राज्य">
    ${p.id ? '' : `<label>ऐप का PIN (ख़ाली = मोबाइल के आख़िरी 4 अंक)</label><input id="wPin" inputmode="numeric" maxlength="6">`}
    <label>नोट</label><input id="wNt" value="${esc(w.notes || '')}">
    ${p.id ? `<label>काम छोड़ने की तारीख़ (छोड़ दे तब भरें)</label><input id="wL" type="date" value="${esc(w.leftDate || '')}">` : ''}
    <div style="height:14px"></div><button id="wGo" class="btn gold block">✅ सेव करें</button>
    ${p.id ? `<div class="row" style="margin-top:10px"><a class="btn ghost" href="#labledger?w=${w.id}">📒 खाता</a><a class="btn ghost" href="#duty?w=${w.id}">🤳 इसकी ड्यूटी लगाएँ</a>${w.hasPhone ? '<button class="btn ghost" id="wRs">📱 फ़ोन रीसेट</button>' : ''}</div>` : ''}
  </div>
  <p class="small muted">🔒 पहचान पत्र की फ़ोटो सिर्फ़ ऑफ़िस/Owner देख सकते हैं।</p>`;
  if (w.photo) imgUrl(w.photo).then(u => { const f = $('wPh'); if (!f || Wp.photo) return; f.classList.add('done'); const im = new Image(); im.src = u; f.appendChild(im); }).catch(() => {});
  document.querySelectorAll('#wSk .chip').forEach(c => c.onclick = () => c.classList.toggle('on'));
  Wp.gps = null;
  const shot = (sid, iid, key) => { $(sid).onclick = () => $(iid).click(); $(iid).onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const r = await snap(f, (val('wN') || 'worker') + ' · ' + key, Wp); Wp[key] = r.data; const el = $(sid); el.classList.add('done'); const o = el.querySelector('img'); if (o) o.remove(); const im = new Image(); im.src = r.data; el.appendChild(im); }; };
  shot('wPh', 'wPhC', 'photo'); shot('wId', 'wIdC', 'idPhoto');
  $('wGo').onclick = async () => {
    if (!val('wN')) return toast('नाम डालें');
    if (val('wHP') === 'Y' && !/^\d{10}$/.test(val('wM'))) return toast('10 अंक का मोबाइल डालें (या "स्मार्टफ़ोन नहीं" चुनें)');
    if (!p.id && !Wp.photo) return toast('चेहरे की फ़ोटो लें');
    if (canRate && !(Number(val('wRt')) > 0)) return toast('रोज़ का रेट डालें');
    const x = { id: p.id || '', name: val('wN'), mobile: val('wM'), hasPhone: val('wHP'), role: val('wR'), site: val('wS'), contractor: val('wC'), skills: [...document.querySelectorAll('#wSk .chip.on')].map(c => c.dataset.v).join(','),
      licenceNo: val('wLn'), licenceExpiry: val('wLe'), upi: val('wU'), bank: val('wB'), emergency: val('wE'), joinDate: val('wJ'), address: val('wAd'), notes: val('wNt'), leftDate: val('wL'), pin: val('wPin'), photo: Wp.photo || '', idPhoto: Wp.idPhoto || '' };
    if (canRate) { x.rate = val('wRt'); x.otRate = val('wOt'); x.rateFrom = val('wRf'); }
    if (x.leftDate && !confirm('काम छोड़ने की तारीख़ भरी है — खाता बंद हो जाएगा। आगे बढ़ें?')) return;
    const b = $('wGo'); b.disabled = true; b.textContent = 'सेव हो रहा है…';
    try { const r = await api('saveWorker', { worker: x }); META = null; store.del('labMeta');
      if (r.pin) { alert(`✅ ${x.name} जुड़ गया।\n\nऐप लॉगिन:\nमोबाइल: ${x.mobile}\nPIN: ${r.pin}\n\nयह जानकारी मज़दूर को दें।`); }
      else toast('✅ सेव हो गया');
      go(x.leftDate ? 'labledger?w=' + r.id : 'labour?tab=workers');
    } catch (e) { toast(e.message, 5000); b.disabled = false; b.textContent = '✅ सेव करें'; }
  };
  if ($('wRs')) $('wRs').onclick = async () => { const pin = prompt('नया फ़ोन चालू करने के लिए रीसेट करें।\nनया PIN डालना हो तो लिखें (वरना ख़ाली छोड़ें):', ''); if (pin === null) return; try { await api('resetWorkerDevice', { workerId: w.id, pin }); toast('✅ फ़ोन रीसेट — मज़दूर नए फ़ोन से लॉगिन कर सकता है'); } catch (e) { toast(e.message); } };
};

// ═══════════════ HOME integration ═══════════════
const baseHome = routes.home;
routes.home = async function () {
  const u = CE.state.user || {};
  if (u.role === 'WORKER') return workerHome(u);
  await baseHome();
  const tiles = document.querySelector('.tiles'); if (!tiles || tiles.querySelector('[href="#labour"],[href="#duty"]')) return;
  const add = [];
  if (can('labourManage') || can('labourView')) add.push(['labour', '👷', 'लेबर / हाज़िरी', 'हाज़िरी, वेतन, एडवांस, रिपोर्ट', 'gold']);
  if (can('duty') && (can('labourManage'))) add.push(['duty', '🤳', 'मेरी ड्यूटी', 'सेल्फ़ी से हाज़िरी']);
  tiles.insertAdjacentHTML('afterbegin', add.map(x => `<a class="tile ${x[4] || ''}" href="#${x[0]}"><span class="ic">${x[1]}</span>${esc(x[2])}<small>${esc(x[3])}</small></a>`).join(''));
  // labour card
  const host = document.getElementById('homeFuel'); if (!host || document.querySelector('.lcard')) return;
  const card = s => `<a class="card lcard" href="#labour" style="margin-top:0"><div class="row"><div><div class="sec">👷 लेबर · आज</div><div class="big" style="font-size:22px">${s.present} / ${s.total} हाज़िर</div><div class="small muted">ड्यूटी पर ${s.onDuty} · नहीं आए ${s.absent} · जाँच बाक़ी ${s.pending}${s.cost !== undefined ? ' · ख़र्च ' + inr(s.cost) : ''}</div></div><div style="flex:0 0 auto;text-align:right">${s.flagged ? `<span class="badge RED">🔴 ${s.flagged}</span><br>` : ''}${s.pendingTxn ? `<span class="badge WATCH" style="margin-top:4px">💵 ${s.pendingTxn}</span>` : ''}</div></div></a>`;
  if (can('dashboard')) {
    // dashboard() already called by base; fetch labour mini separately only if not included
    try { const d = await api('labourData', { view: 'today' }); const s = { total: 0, present: 0, onDuty: 0, absent: 0, pending: 0, flagged: 0, cost: 0, pendingTxn: d.pendingTxn.length };
      d.sites.forEach(x => { s.total += x.total; s.present += x.present; s.onDuty += x.onDuty; s.absent += x.absent.length; s.pending += x.pending; s.flagged += x.flagged; s.cost += x.cost; });
      if (!(can('labourView') || can('labourPay'))) delete s.cost;
      if (!document.querySelector('.lcard') && document.getElementById('homeFuel') === host) host.insertAdjacentHTML('afterend', card(s)); } catch (e) {}
  } else if (can('labourManage')) {
    try { const d = await api('labourData', { view: 'today' }); const s = { total: 0, present: 0, onDuty: 0, absent: 0, pending: 0, flagged: 0, pendingTxn: d.pendingTxn.length };
      d.sites.forEach(x => { s.total += x.total; s.present += x.present; s.onDuty += x.onDuty; s.absent += x.absent.length; s.pending += x.pending; s.flagged += x.flagged; });
      if (!document.querySelector('.lcard') && document.getElementById('homeFuel') === host) host.insertAdjacentHTML('afterend', card(s)); } catch (e) {}
  }
};
async function workerHome(u) {
  let m = null; try { m = await meta(true); } catch (e) { m = META; }
  const lo = store.get('dutyOpen', null);
  const open = (m && m.open) || (lo && Date.now() - lo.at < 20 * 36e5 ? lo : null);
  $app.innerHTML = `
  <div class="card hello"><div class="eyebrow">Choudhary Enterprises · CE Connect</div><div class="mid" style="margin-top:4px">🙏 नमस्ते, ${esc(u.name)}</div><div class="muted small">${esc((m && m.me && ROLE_HI[m.me.role]) || 'मज़दूर')} · ${esc(siteName(u.site) || u.site || '')}</div></div>
  <a class="card duty-hero" href="#duty" style="display:block;text-decoration:none;color:inherit;border:2px solid ${open ? 'var(--green)' : 'var(--gold)'}">
    <div style="font-size:46px">${open ? '🟢' : '🤳'}</div><div class="big" style="font-size:24px">${open ? 'ड्यूटी चालू है' : 'ड्यूटी शुरू करें'}</div>
    <div class="since">${open ? 'ख़त्म करने के लिए यहाँ दबाएँ' : 'सेल्फ़ी + मशीन की फ़ोटो से हाज़िरी'}</div></a>
  <div class="tiles">
    <a class="tile primary" href="#mywork"><span class="ic">📒</span>मेरा हिसाब<small>हाज़िरी, कमाई, एडवांस</small></a>
    <a class="tile" href="#labevent?type=BREAKDOWN"><span class="ic">🔧</span>मशीन ख़राब<small>फ़ोटो के साथ रिपोर्ट</small></a>
    <a class="tile" href="#labevent?type=LEAVE"><span class="ic">🗓️</span>छुट्टी अर्ज़ी<small>मुनीम को भेजें</small></a>
    <a class="tile" href="#profile"><span class="ic">⚙️</span>प्रोफ़ाइल<small>PIN बदलें</small></a>
  </div>
  <div class="foot">System by <b>${esc(CFG.FIRM_NAME || '')}</b> · 📞 ${esc(CFG.FIRM_PHONE || '')}</div>`;
}

// ── Users form: add "munim — labour rights" option
const baseUsers = routes.users;
routes.users = async function (p) {
  await baseUsers(p);
  const sv = document.getElementById('sv'); if (!sv || !(p.id || p.new)) return;
  let cur = 'N';
  try { const r = await api('listUsers'); const u = p.id ? r.items.find(x => x.id === p.id) : null; cur = u && u.labour === 'Y' ? 'Y' : 'N'; } catch (e) {}
  sv.insertAdjacentHTML('beforebegin', `<label>👷 लेबर / हाज़िरी अधिकार (मुनीम)</label><select id="lb"><option value="N">नहीं</option><option value="Y" ${cur === 'Y' ? 'selected' : ''}>हाँ — अपनी साइट की हाज़िरी, भुगतान</option></select><div style="height:14px"></div>`);
  const v = id => (document.getElementById(id) || {}).value || '';
  sv.onclick = async () => {
    try { await api('saveUser', { user: { id: p.id || '', name: v('n').trim(), mobile: v('m').trim(), email: v('e').trim(), role: v('r'), site: v('s').trim(), pin: v('pn').trim(), active: v('a'), fuelEntry: v('fe'), labour: v('lb') } }); toast('✅'); go('users'); } catch (e) { toast(e.message); }
  };
};
})();
