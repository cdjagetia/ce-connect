/* CE Connect — PWA front-end (vanilla JS, no build step) */
(function () {
'use strict';
const CFG = window.CE_CONFIG || {};
const DEMO = !CFG.API_URL;
const $app = document.getElementById('app');
const store = {
  get(k, d) { try { const v = localStorage.getItem('ce_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ce_' + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem('ce_' + k); } catch (e) {} }
};
let state = { token: store.get('token', ''), user: store.get('user', null), lang: store.get('lang', 'hi') };

// ───────────── i18n ─────────────
const T = {
  hi: {
    login: 'लॉगिन करें', mobile: 'मोबाइल नंबर', pin: 'PIN (4–6 अंक)', loginPin: 'मोबाइल + PIN से लॉगिन', or: 'या', loginGoogle: 'Gmail से लॉगिन',
    hello: 'नमस्ते', home: 'होम', invoices: 'इनवॉइस (बिल)', invoicesSub: 'कोई भी sales invoice ढूँढें और भेजें',
    upload: 'बिल अपलोड करें', uploadSub: 'Purchase bill / slip की फोटो', myUploads: 'मेरे अपलोड', allUploads: 'सभी अपलोड', uploadsSub: 'भेजे गए बिल का status',
    requests: 'काम / बातचीत', requestsSub: 'कुछ भी माँगें या पूछें', ledgers: 'लेजर / खाते', ledgersSub: 'किसी भी party का हिसाब',
    dashboard: 'आज का हिसाब', dashboardSub: 'पैसा आया / गया, बकाया', users: 'यूज़र्स', usersSub: 'लॉगिन बनाएँ / बदलें', profile: 'प्रोफ़ाइल',
    search: 'खोजें — party, invoice no, महीना…', allFY: 'सभी साल', open: 'खोलें', share: 'WhatsApp / Share', download: 'डाउनलोड',
    noData: 'कुछ नहीं मिला', loading: 'लोड हो रहा है…', docType: 'किस चीज़ का कागज़?', party: 'Party / दुकान का नाम', billNo: 'बिल नंबर', billDate: 'बिल तारीख', amount: 'राशि (₹)', note: 'नोट (साइट, गाड़ी नं. आदि)',
    site: 'साइट', pickFiles: '📷 फोटो खींचें या PDF चुनें', submitUpload: 'अपलोड करें', uploaded: '✅ अपलोड हो गया — ऑफिस को मिल गया',
    queued: '📶 नेटवर्क नहीं है — बिल फ़ोन में सुरक्षित है, नेटवर्क आते ही अपने-आप चला जाएगा', queueN: 'अपलोड बाकी (नेटवर्क का इंतज़ार):',
    newRequest: '+ नया काम / सवाल', reqType: 'क्या चाहिए?', subject: 'विषय', message: 'पूरी बात लिखें', send: 'भेजें', reply: 'जवाब लिखें…', attach: '📎 फाइल',
    status: 'स्थिति', active: 'चालू', done: 'पूरा', all: 'सभी', markDone: '✔ पूरा हुआ', markProgress: '⏳ काम चालू', reopen: '↺ फिर खोलें',
    bankBal: 'बैंक में बैलेंस', lastDay: 'आख़िरी दिन', inMoney: 'पैसा आया', outMoney: 'पैसा गया', week: 'पिछले 7 दिन', receivable: 'बकाया — लेना है', payable: 'देना है',
    topDebtors: 'सबसे ज़्यादा बकाया', pendingReq: 'चालू काम', newUploadsK: 'नए अपलोड', invMonth: 'इस महीने के इनवॉइस', synced: 'Tally से अपडेट',
    opening: 'शुरुआती बैलेंस', closing: 'बाकी बैलेंस', from: 'से', to: 'तक', askSigned: '✍️ DSC वाला ledger मँगवाएँ', shareText: 'संक्षेप भेजें',
    changePin: 'PIN बदलें', oldPin: 'पुराना PIN', newPin: 'नया PIN', save: 'सेव करें', logout: 'लॉगआउट', language: 'भाषा',
    addUser: '+ नया यूज़र', name: 'नाम', email: 'Gmail', role: 'रोल', activeQ: 'चालू?', yes: 'हाँ', no: 'नहीं', setPin: 'PIN (नया डालें तो बदलेगा)',
    installHint: '📲 इसे फ़ोन की होम स्क्रीन पर लगाएँ: ब्राउज़र मेन्यू ⋮ → "Add to Home screen"', install: 'होम स्क्रीन पर लगाएँ',
    demo: 'DEMO मोड — sample data, कुछ सेव नहीं होगा। रोल बदलकर देखें:', help: 'मदद', status_New: 'नया', status_Filed: 'फाइल हुआ', status_Query: 'सवाल है', status_Open: 'खुला', status_InProgress: 'चालू', status_Done: 'पूरा',
    sessionExpired: 'सेशन खत्म — दोबारा लॉगिन करें', err: 'गड़बड़ हुई', needFile: 'पहले फोटो या PDF चुनें', needParty: 'Party का नाम लिखें',
    reqTypes: { 'Diesel Payment': '⛽ डीज़ल पेमेंट', 'Invoice': '🧾 इनवॉइस चाहिए', 'Ledger': '📒 लेजर चाहिए', 'New Bill': '🆕 नया बिल बनवाना', 'Payment': '💰 पेमेंट की जानकारी', 'Document': '📄 कागज़ / डॉक्यूमेंट', 'Other': '💬 अन्य' },
    docTypes: { 'Purchase Bill': '🧾 खरीद बिल (Purchase)', 'Diesel Slip': '⛽ डीज़ल पर्ची', 'Loan Papers': '🏦 लोन / EMI कागज़', 'Work Order': '📋 वर्क ऑर्डर', 'Other': '📄 अन्य' },
    dr: 'नाम', cr: 'जमा',
    fuel: '⛽ डीज़ल एंट्री', fuelSub: 'भराई दर्ज करें — फ़ोटो + लोकेशन', fuelRoom: 'डीज़ल कंट्रोल रूम', fuelRoomSub: 'एवरेज, अलर्ट, पेंडिंग पेमेंट',
    print: 'प्रिंट / PDF', syncOk: 'Tally sync ठीक', syncLate: 'Tally sync देर से', syncBad: 'Tally sync में दिक्कत', fuelPerm: 'डीज़ल एंट्री की अनुमति'
  },
  en: {
    login: 'Login', mobile: 'Mobile number', pin: 'PIN (4–6 digits)', loginPin: 'Login with Mobile + PIN', or: 'or', loginGoogle: 'Login with Gmail',
    hello: 'Hello', home: 'Home', invoices: 'Invoices', invoicesSub: 'Find & share any sales invoice',
    upload: 'Upload bill', uploadSub: 'Photo of purchase bill / slip', myUploads: 'My uploads', allUploads: 'All uploads', uploadsSub: 'Status of bills sent',
    requests: 'Requests / Chat', requestsSub: 'Ask for anything', ledgers: 'Ledgers', ledgersSub: 'Any party account',
    dashboard: "Today's summary", dashboardSub: 'Money in / out, receivables', users: 'Users', usersSub: 'Create / edit logins', profile: 'Profile',
    search: 'Search — party, invoice no, month…', allFY: 'All years', open: 'Open', share: 'WhatsApp / Share', download: 'Download',
    noData: 'Nothing found', loading: 'Loading…', docType: 'Document type', party: 'Party / supplier name', billNo: 'Bill no.', billDate: 'Bill date', amount: 'Amount (₹)', note: 'Note (site, vehicle no. etc.)',
    site: 'Site', pickFiles: '📷 Take photo or choose PDF', submitUpload: 'Upload', uploaded: '✅ Uploaded — office has received it',
    queued: '📶 No network — bill saved on phone, will upload automatically when network returns', queueN: 'Uploads waiting for network:',
    newRequest: '+ New request', reqType: 'What do you need?', subject: 'Subject', message: 'Details', send: 'Send', reply: 'Write a reply…', attach: '📎 File',
    status: 'Status', active: 'Active', done: 'Done', all: 'All', markDone: '✔ Mark done', markProgress: '⏳ In progress', reopen: '↺ Reopen',
    bankBal: 'Bank balance', lastDay: 'Last day', inMoney: 'Money in', outMoney: 'Money out', week: 'Last 7 days', receivable: 'Receivable', payable: 'Payable',
    topDebtors: 'Top outstanding', pendingReq: 'Open requests', newUploadsK: 'New uploads', invMonth: 'Invoices this month', synced: 'Updated from Tally',
    opening: 'Opening', closing: 'Closing', from: 'From', to: 'To', askSigned: '✍️ Request DSC-signed ledger', shareText: 'Share summary',
    changePin: 'Change PIN', oldPin: 'Old PIN', newPin: 'New PIN', save: 'Save', logout: 'Logout', language: 'Language',
    addUser: '+ Add user', name: 'Name', email: 'Gmail', role: 'Role', activeQ: 'Active?', yes: 'Yes', no: 'No', setPin: 'PIN (enter to set/change)',
    installHint: '📲 Add to home screen: browser menu ⋮ → "Add to Home screen"', install: 'Install app',
    demo: 'DEMO mode — sample data, nothing is saved. Try a role:', help: 'Help', status_New: 'New', status_Filed: 'Filed', status_Query: 'Query', status_Open: 'Open', status_InProgress: 'In progress', status_Done: 'Done',
    sessionExpired: 'Session expired — please login again', err: 'Something went wrong', needFile: 'Choose a photo or PDF first', needParty: 'Enter party name',
    reqTypes: { 'Diesel Payment': '⛽ Diesel payment', 'Invoice': '🧾 Need invoice', 'Ledger': '📒 Need ledger', 'New Bill': '🆕 Make new bill', 'Payment': '💰 Payment info', 'Document': '📄 Document', 'Other': '💬 Other' },
    docTypes: { 'Purchase Bill': '🧾 Purchase bill', 'Diesel Slip': '⛽ Diesel slip', 'Loan Papers': '🏦 Loan / EMI papers', 'Work Order': '📋 Work order', 'Other': '📄 Other' },
    dr: 'Dr', cr: 'Cr',
    fuel: '⛽ Diesel entry', fuelSub: 'Record a fill — photo + location', fuelRoom: 'Diesel control room', fuelRoomSub: 'Average, alerts, pending payments',
    print: 'Print / PDF', syncOk: 'Tally sync OK', syncLate: 'Tally sync delayed', syncBad: 'Tally sync problem', fuelPerm: 'Diesel entry allowed'
  }
};
const t = k => (T[state.lang] && T[state.lang][k] !== undefined) ? T[state.lang][k] : (T.en[k] !== undefined ? T.en[k] : k);
const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Math.abs(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const inr2 = n => '₹' + Math.abs(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const drcr = n => (Number(n) || 0) >= 0 ? t('dr') : t('cr');
const fmtDate = s => { if (!s) return ''; const d = String(s).slice(0, 10).split('-'); return d.length === 3 ? `${d[2]}-${d[1]}-${d[0]}` : s; };
const fmtDT = s => s ? fmtDate(s) + ' ' + String(s).slice(11, 16) : '';
const can = p => !!(state.user && state.user.perms && state.user.perms.indexOf(p) >= 0);

function toast(msg, ms) { const el = document.getElementById('toast'); el.textContent = msg; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => el.hidden = true, ms || 3200); }
function spinner() { $app.innerHTML = '<div class="spinner"></div>'; }

// ───────────── API ─────────────
async function api(action, data) {
  const body = Object.assign({ action, token: state.token }, data || {});
  if (DEMO) return Demo.call(action, body);
  const res = await fetch(CFG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  const j = await res.json();
  if (!j.ok) {
    if (j.error === 'AUTH') { logoutLocal(); toast(t('sessionExpired')); throw new Error('AUTH'); }
    throw new Error(j.error || t('err'));
  }
  return j;
}

// ───────────── Offline upload queue (IndexedDB) ─────────────
const Q = {
  db: null,
  open() { return this.db ? Promise.resolve(this.db) : new Promise((ok, no) => { const r = indexedDB.open('ce_connect', 1); r.onupgradeneeded = () => r.result.createObjectStore('queue', { keyPath: 'qid' }); r.onsuccess = () => { this.db = r.result; ok(this.db); }; r.onerror = () => no(r.error); }); },
  async tx(mode, fn) { const db = await this.open(); return new Promise((ok, no) => { const tx = db.transaction('queue', mode); const st = tx.objectStore('queue'); const out = fn(st); tx.oncomplete = () => ok(out && out.result !== undefined ? out.result : out); tx.onerror = () => no(tx.error); }); },
  add(item) { item.qid = Date.now() + '_' + Math.random().toString(36).slice(2, 7); return this.tx('readwrite', st => st.put(item)); },
  all() { return this.tx('readonly', st => st.getAll()); },
  del(qid) { return this.tx('readwrite', st => st.delete(qid)); }
};
let flushing = false;
async function flushQueue() {
  if (flushing || DEMO || !state.token || !navigator.onLine) return refreshQueueBar();
  flushing = true;
  try {
    const items = await Q.all();
    for (const it of items) {
      try { await api(it.action || 'uploadDoc', it.payload); await Q.del(it.qid); toast(it.action === 'fuelSave' ? '⛽ ' + t('uploaded') : t('uploaded')); }
      catch (e) { if (e.message === 'AUTH') break; if (!navigator.onLine) break; }
    }
  } catch (e) {} finally { flushing = false; refreshQueueBar(); }
}
async function refreshQueueBar() {
  const bar = document.getElementById('queueBar');
  try { const n = (await Q.all()).length; bar.hidden = !n; bar.textContent = t('queueN') + ' ' + n; } catch (e) { bar.hidden = true; }
}
window.addEventListener('online', flushQueue);

// ───────────── Files helpers ─────────────
function b64ToBlob(b64, mime) { const bin = atob(b64); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
function blobToB64(blob) { return new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(blob); }); }
async function compressImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file; // pdf / heic go as-is
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
  const max = 1800, s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.8));
  return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
}
async function fileToPayload(file) { return { name: file.name, mimeType: file.type || 'application/octet-stream', data: await blobToB64(file) }; }
async function openFile(fileId, mode) {
  toast(t('loading'), 1500);
  try {
    const r = await api('getFile', { fileId });
    const blob = b64ToBlob(r.data, r.mimeType);
    const f = new File([blob], r.name, { type: r.mimeType });
    if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: r.name }); return; }
    const url = URL.createObjectURL(blob);
    if (mode === 'download' || mode === 'share') { const a = document.createElement('a'); a.href = url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove(); }
    else window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) { if (e.name !== 'AbortError' && e.message !== 'AUTH') toast(e.message); }
}

// ───────────── Router ─────────────
const routes = {};
function go(hash) { location.hash = hash; }
function parseHash() { const h = location.hash.replace(/^#\/?/, '') || 'home'; const [path, qs] = h.split('?'); const params = {}; (qs || '').split('&').filter(Boolean).forEach(p => { const [k, v] = p.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); }); return { path, params }; }
async function render() {
  document.body.classList.toggle('hi', state.lang === 'hi');
  document.documentElement.lang = state.lang;
  document.getElementById('langBtn').textContent = state.lang === 'hi' ? 'EN' : 'हिं';
  renderDemoBar();
  if (!state.token || !state.user) { document.getElementById('backBtn').hidden = true; return Login(); }
  const { path, params } = parseHash();
  const view = routes[path] || routes.home;
  document.getElementById('backBtn').hidden = path === 'home';
  document.getElementById('topSub').textContent = state.user.name + ' · ' + (state.user.site || state.user.roleLabel || '');
  window.scrollTo(0, 0);
  try { await view(params); } catch (e) { if (e.message !== 'AUTH') $app.innerHTML = `<div class="card center">⚠️ ${esc(e.message)}<br><br><button class="btn ghost" onclick="location.reload()">Retry</button></div>`; else render(); }
}
window.addEventListener('hashchange', render);
document.getElementById('backBtn').onclick = () => history.length > 1 ? history.back() : go('home');
document.getElementById('langBtn').onclick = () => { state.lang = state.lang === 'hi' ? 'en' : 'hi'; store.set('lang', state.lang); render(); };

function setSession(r) { state.token = r.token; state.user = r.user; store.set('token', r.token); store.set('user', r.user); if (r.user.role === 'OWNER' && !store.get('langSet')) { state.lang = 'hi'; store.set('lang', 'hi'); } }
function logoutLocal() { state.token = ''; state.user = null; store.del('token'); store.del('user'); }

// ───────────── Views ─────────────
function Login() {
  document.getElementById('topSub').textContent = CFG.CLIENT_NAME || '';
  const gid = CFG.GOOGLE_CLIENT_ID;
  $app.innerHTML = `
  <div class="login-box">
    <div class="card hello"><div class="mid">🙏 ${t('hello')}</div><div class="muted">${esc(CFG.CLIENT_NAME)} ⇄ ${esc(CFG.FIRM_NAME)}</div></div>
    <div class="card">
      <h2>${t('login')}</h2>
      <label>${t('mobile')}</label><input id="mob" type="tel" inputmode="numeric" maxlength="13" placeholder="98xxxxxxxx" autocomplete="tel">
      <label>${t('pin')}</label><input id="pin" type="password" inputmode="numeric" maxlength="6" placeholder="••••">
      <div style="height:14px"></div><button id="pinBtn" class="btn block">${t('loginPin')}</button>
      ${gid || DEMO ? `<div class="or">${t('or')}</div><div id="gbtn" style="display:flex;justify-content:center"></div>` : ''}
      ${DEMO ? `<button id="demoG" class="btn ghost block">G  ${t('loginGoogle')} (demo)</button>` : ''}
    </div>
    <div class="foot">${esc(CFG.FIRM_NAME)} · ${esc(CFG.FIRM_PHONE)}</div>
  </div>`;
  const doPin = async () => {
    const b = document.getElementById('pinBtn'); b.disabled = true;
    try { setSession(await api('loginPin', { mobile: document.getElementById('mob').value, pin: document.getElementById('pin').value, device: navigator.userAgent })); go('home'); render(); }
    catch (e) { toast(e.message); } finally { b.disabled = false; }
  };
  document.getElementById('pinBtn').onclick = doPin;
  document.getElementById('pin').onkeydown = e => { if (e.key === 'Enter') doPin(); };
  if (DEMO) document.getElementById('demoG').onclick = async () => { setSession(await api('loginGoogle', { credential: 'demo' })); go('home'); render(); };
  if (gid && !DEMO) loadGoogle(gid);
}
function loadGoogle(gid) {
  const init = () => {
    google.accounts.id.initialize({ client_id: gid, callback: async resp => {
      try { setSession(await api('loginGoogle', { credential: resp.credential, device: navigator.userAgent })); go('home'); render(); } catch (e) { toast(e.message, 5000); }
    } });
    const el = document.getElementById('gbtn'); if (el) google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: 300 });
  };
  if (window.google && google.accounts) return init();
  const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init; document.head.appendChild(s);
}

routes.home = async function () {
  const u = state.user;
  const tiles = [];
  if (can('dashboard')) tiles.push(['dashboard', '📊', t('dashboard'), t('dashboardSub'), 'primary']);
  if (can('fuelEntry')) tiles.push(['fuel', '⛽', t('fuel'), t('fuelSub'), 'gold']);
  if (can('fuelView')) tiles.push(['fuelroom', '🛡️', t('fuelRoom'), t('fuelRoomSub')]);
  if (can('upload')) tiles.push(['upload', '📤', t('upload'), t('uploadSub'), can('dashboard') || can('fuelEntry') ? '' : 'primary']);
  if (can('invoices')) tiles.push(['invoices', '🧾', t('invoices'), t('invoicesSub')]);
  tiles.push(['requests', '💬', t('requests'), t('requestsSub')]);
  if (can('ledgers')) tiles.push(['ledgers', '📒', t('ledgers'), t('ledgersSub')]);
  tiles.push(['uploads', '📁', can('uploadsAll') ? t('allUploads') : t('myUploads'), t('uploadsSub')]);
  if (can('users')) tiles.push(['users', '👥', t('users'), t('usersSub')]);
  tiles.push(['profile', '⚙️', t('profile'), u.mobile || u.email || '']);
  $app.innerHTML = `
    <div class="card hello"><div class="eyebrow">Choudhary Enterprises · CE Connect</div><div class="mid" style="margin-top:4px">🙏 ${t('hello')}, ${esc(u.role === 'OWNER' ? (u.name.indexOf('Choudhary') >= 0 ? u.name : u.name + ' जी') : u.name)}</div><div class="muted small">${esc(u.roleLabel || '')}${u.site ? ' · ' + esc(u.site) : ''}</div></div>
    <div id="homeHealth"></div><div id="homeKpi"></div><div id="homeFuel"></div>
    <div class="tiles">${tiles.map(x => `<a class="tile ${x[4] || ''}" href="#${x[0]}"><span class="ic">${x[1]}</span>${esc(x[2])}<small>${esc(x[3])}</small></a>`).join('')}</div>
    ${installCard()}
    <div class="foot">System by <b>${esc(CFG.FIRM_NAME)}</b> · 📞 ${esc(CFG.FIRM_PHONE)}</div>`;
  bindInstall();
  if (can('dashboard')) {
    try {
      const d = await api('dashboard');
      const el = document.getElementById('homeKpi'); if (!el) return;
      if (can('syncHealth')) document.getElementById('homeHealth').innerHTML = healthHtml(d.sync);
      if (d.fuel) document.getElementById('homeFuel').innerHTML = `<a class="card fuelcard" href="#fuelroom" style="display:block;text-decoration:none;color:inherit"><div class="row"><div><div class="sec">⛽ डीज़ल · इस महीने</div><div class="big" style="font-size:22px">${Math.round(d.fuel.monthL).toLocaleString('en-IN')} L · ${inr(d.fuel.monthAmt)}</div><div class="small muted">आज ${d.fuel.todayN} भराई · ${inr(d.fuel.todayAmt)} &nbsp;|&nbsp; पेंडिंग पेमेंट ${d.fuel.pendingN} · ${inr(d.fuel.pendingAmt)}</div></div><div style="flex:0 0 auto;text-align:center"><span class="badge ${d.fuel.red ? 'RED' : 'OK'}" style="font-size:13px">🔴 RED ${d.fuel.red}</span></div></div></a>`;
      el.innerHTML = `<div class="kpis" style="margin-bottom:12px">
        <div class="kpi in"><div class="l">${t('inMoney')} · ${fmtDate(d.lastDay.date)}</div><div class="v">${inr(d.lastDay.inTotal)}</div></div>
        <div class="kpi out"><div class="l">${t('outMoney')} · ${fmtDate(d.lastDay.date)}</div><div class="v">${inr(d.lastDay.outTotal)}</div></div>
        <div class="kpi"><div class="l">${t('receivable')}</div><div class="v">${inr(d.debtorsTotal)}</div></div>
        <div class="kpi"><div class="l">${t('pendingReq')} / ${t('newUploadsK')}</div><div class="v">${d.openRequests} / ${d.newUploads}</div></div></div>`;
    } catch (e) {}
  }
};

function healthHtml(s) {
  if (!s) return `<div class="health warn"><span class="dot"></span>${t('syncLate')} — अभी तक कोई sync नहीं</div>`;
  const cls = s.status === 'ERROR' ? 'bad' : (s.status === 'CHECK' || s.ageMin > 180) ? 'warn' : 'ok';
  const lbl = cls === 'ok' ? t('syncOk') : cls === 'bad' ? t('syncBad') : t('syncLate');
  const age = s.ageMin < 60 ? s.ageMin + ' मिनट पहले' : Math.round(s.ageMin / 60) + ' घंटे पहले';
  return `<div class="health ${cls}"><span class="dot"></span><div style="flex:1">${lbl} · ${age}<div class="small" style="font-weight:500;opacity:.85">${esc(s.ledgers)} ledgers · ${esc(s.entries)} entries · ${esc(s.note || '')}</div></div></div>`;
}

routes.invoices = async function (p) {
  $app.innerHTML = `<h2>🧾 ${t('invoices')}</h2>
    <div class="sticky-search"><input id="q" type="search" placeholder="${t('search')}" value="${esc(p.q || '')}"><div class="chips" id="fys"></div></div>
    <div class="card list" id="list"><div class="spinner"></div></div>`;
  let fy = p.fy || '', timer;
  const load = async () => {
    const r = await api('listInvoices', { q: document.getElementById('q').value, fy, limit: 80 });
    document.getElementById('fys').innerHTML = [''].concat(r.fys).map(f => `<span class="chip ${f === fy ? 'on' : ''}" data-fy="${esc(f)}">${f ? esc(f) : t('allFY')}</span>`).join('');
    document.querySelectorAll('#fys .chip').forEach(c => c.onclick = () => { fy = c.dataset.fy; load(); });
    document.getElementById('list').innerHTML = r.items.length ? r.items.map(i => `
      <div class="item"><span class="ic">📄</span><div class="main"><div class="t">${esc(i.name.replace(/\.pdf$/i, ''))}</div><div class="s">${esc(i.path)} · ${esc(i.sizeKB)} KB</div>
        <div class="row" style="margin-top:8px;gap:8px"><button class="btn sm ghost" data-open="${i.fileId}">${t('open')}</button><button class="btn sm alt" data-share="${i.fileId}">${t('share')}</button></div></div></div>`).join('') + (r.total > r.items.length ? `<div class="s center">+${r.total - r.items.length} … ${t('search')}</div>` : '')
      : `<div class="center muted">${t('noData')}</div>`;
    document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openFile(b.dataset.open, 'open'));
    document.querySelectorAll('[data-share]').forEach(b => b.onclick = () => openFile(b.dataset.share, 'share'));
  };
  document.getElementById('q').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
  await load();
};

routes.upload = async function () {
  const types = t('docTypes');
  let files = [];
  $app.innerHTML = `<h2>📤 ${t('upload')}</h2>
    <div class="card">
      <label>${t('docType')}</label><div class="chips" id="dt">${Object.keys(types).map((k, i) => `<span class="chip ${i === 0 ? 'on' : ''}" data-k="${k}">${types[k]}</span>`).join('')}</div>
      <label>${t('pickFiles')}</label>
      <label class="file-pick" for="fileIn">📷 / 📄<br><span class="small muted">${t('pickFiles')}</span></label>
      <input id="fileIn" type="file" accept="image/*,application/pdf" multiple hidden>
      <div class="thumbs" id="thumbs"></div>
      <label>${t('party')}</label><input id="party" list="partyList" autocomplete="off"><datalist id="partyList"></datalist>
      <div class="row"><div><label>${t('billNo')}</label><input id="billNo"></div><div><label>${t('billDate')}</label><input id="billDate" type="date"></div></div>
      <div class="row"><div><label>${t('amount')}</label><input id="amount" type="number" inputmode="decimal"></div><div><label>${t('site')}</label><input id="site" value="${esc(state.user.site || '')}"></div></div>
      <label>${t('note')}</label><textarea id="note" style="min-height:60px"></textarea>
      <div style="height:14px"></div><button id="go" class="btn alt block">${t('submitUpload')}</button>
    </div>`;
  const recent = store.get('parties', []); document.getElementById('partyList').innerHTML = recent.map(p => `<option value="${esc(p)}">`).join('');
  let docType = Object.keys(types)[0];
  document.querySelectorAll('#dt .chip').forEach(c => c.onclick = () => { document.querySelectorAll('#dt .chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); docType = c.dataset.k; });
  const drawThumbs = () => { document.getElementById('thumbs').innerHTML = files.map((f, i) => `<div>${f.type.startsWith('image/') ? `<img src="${URL.createObjectURL(f)}">` : '📄 PDF'}<button data-rm="${i}">×</button></div>`).join(''); document.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { files.splice(+b.dataset.rm, 1); drawThumbs(); }); };
  document.getElementById('fileIn').onchange = async e => { for (const f of e.target.files) files.push(await compressImage(f)); e.target.value = ''; drawThumbs(); };
  document.getElementById('go').onclick = async () => {
    if (!files.length) return toast(t('needFile'));
    const party = document.getElementById('party').value.trim(); if (!party && docType === 'Purchase Bill') return toast(t('needParty'));
    const btn = document.getElementById('go'); btn.disabled = true; btn.textContent = t('loading');
    const meta = { docType, partyName: party, billNo: document.getElementById('billNo').value.trim(), billDate: document.getElementById('billDate').value, amount: document.getElementById('amount').value, site: document.getElementById('site').value.trim(), note: document.getElementById('note').value.trim() };
    if (party) store.set('parties', [party].concat(recent.filter(x => x !== party)).slice(0, 30));
    let queued = 0;
    for (let i = 0; i < files.length; i++) {
      const payload = Object.assign({}, meta, { file: await fileToPayload(files[i]) });
      if (files.length > 1) payload.note = (meta.note ? meta.note + ' · ' : '') + 'page ' + (i + 1) + '/' + files.length;
      try { if (!navigator.onLine) throw new TypeError('offline'); await api('uploadDoc', payload); }
      catch (e) { if (e instanceof TypeError || !navigator.onLine) { await Q.add({ payload, at: Date.now() }); queued++; } else { toast(e.message); btn.disabled = false; btn.textContent = t('submitUpload'); return; } }
    }
    toast(queued ? t('queued') : t('uploaded'), 4500); refreshQueueBar(); go('uploads');
  };
};

routes.uploads = async function () {
  spinner();
  const r = await api('listUploads', { limit: 100 });
  const review = can('uploadsReview');
  $app.innerHTML = `<h2>📁 ${can('uploadsAll') ? t('allUploads') : t('myUploads')}</h2><a class="btn alt block" href="#upload">📤 ${t('upload')}</a><div style="height:12px"></div>
    <div class="card list">${r.items.length ? r.items.map(x => `
      <div class="item"><span class="ic">${x.docType === 'Diesel Slip' ? '⛽' : x.docType === 'Loan Papers' ? '🏦' : '🧾'}</span><div class="main">
        <div class="t">${esc(x.partyName || x.docType)} ${x.amount ? '· ' + inr(x.amount) : ''}</div>
        <div class="s">${esc(x.docType)} · ${esc(x.billNo)} ${x.billDate ? '· ' + fmtDate(x.billDate) : ''} · ${esc(x.userName)} ${x.site ? '(' + esc(x.site) + ')' : ''} · ${fmtDT(x.uploadedAt)}</div>
        ${x.reviewNote ? `<div class="s">💬 ${esc(x.reviewNote)}</div>` : ''}
        <div class="row wrap" style="margin-top:8px;gap:8px"><span class="badge ${x.status}">${t('status_' + x.status)}</span><button class="btn sm ghost" data-open="${x.fileId}">${t('open')}</button>
        ${review ? `<button class="btn sm ghost" data-rv="${x.id}" data-st="Filed">✔ ${t('status_Filed')}</button><button class="btn sm ghost" data-rv="${x.id}" data-st="Query">? ${t('status_Query')}</button>` : ''}</div>
      </div></div>`).join('') : `<div class="center muted">${t('noData')}</div>`}</div>`;
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openFile(b.dataset.open, 'open'));
  document.querySelectorAll('[data-rv]').forEach(b => b.onclick = async () => { const note = b.dataset.st === 'Query' ? prompt('Query / सवाल:') || '' : ''; await api('reviewUpload', { id: b.dataset.rv, status: b.dataset.st, reviewNote: note }); render(); });
};

routes.requests = async function (p) {
  const st = p.st || 'active';
  $app.innerHTML = `<h2>💬 ${t('requests')}</h2><a class="btn alt block" href="#newrequest">${t('newRequest')}</a>
    <div class="chips" style="margin:12px 0">${[['active', t('active')], ['Done', t('done')], ['', t('all')]].map(x => `<a class="chip ${x[0] === st ? 'on' : ''}" href="#requests?st=${x[0]}">${x[1]}</a>`).join('')}</div>
    <div class="card list" id="list"><div class="spinner"></div></div>`;
  const r = await api('listRequests', { status: st });
  const types = t('reqTypes');
  document.getElementById('list').innerHTML = r.items.length ? r.items.map(x => `
    <a class="item" href="#request?id=${x.id}" style="text-decoration:none;color:inherit"><span class="ic">${(types[x.type] || '💬').split(' ')[0]}</span><div class="main">
      <div class="t">${esc(x.subject)}</div><div class="s">${esc(x.userName)} · ${fmtDT(x.updatedAt)} · ${esc(x.id)}</div></div><span class="badge ${x.status.replace(/\s/g, '')}">${t('status_' + x.status.replace(/\s/g, ''))}</span></a>`).join('')
    : `<div class="center muted">${t('noData')}</div>`;
};

routes.newrequest = async function (p) {
  const types = t('reqTypes');
  let type = p.type || 'Invoice', file = null;
  $app.innerHTML = `<h2>${t('newRequest')}</h2><div class="card">
    <label>${t('reqType')}</label><div class="chips" id="rt">${Object.keys(types).map(k => `<span class="chip ${k === type ? 'on' : ''}" data-k="${k}">${types[k]}</span>`).join('')}</div>
    <label>${t('subject')}</label><input id="sub" value="${esc(p.subject || '')}">
    <label>${t('message')}</label><textarea id="msg">${esc(p.message || '')}</textarea>
    <div class="row" style="margin-top:10px"><label class="btn ghost sm" for="rf" style="flex:0 0 auto;margin:0">${t('attach')}</label><span id="rfn" class="small muted"></span></div>
    <input id="rf" type="file" accept="image/*,application/pdf" hidden>
    <div style="height:14px"></div><button id="go" class="btn block">${t('send')}</button></div>`;
  document.querySelectorAll('#rt .chip').forEach(c => c.onclick = () => { document.querySelectorAll('#rt .chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); type = c.dataset.k; });
  document.getElementById('rf').onchange = async e => { file = e.target.files[0] ? await compressImage(e.target.files[0]) : null; document.getElementById('rfn').textContent = file ? file.name : ''; };
  document.getElementById('go').onclick = async () => {
    const b = document.getElementById('go'); b.disabled = true;
    try {
      const sub = document.getElementById('sub').value.trim() || types[type].replace(/^\S+\s/, '');
      const r = await api('createRequest', { type, subject: sub, message: document.getElementById('msg').value.trim(), file: file ? await fileToPayload(file) : null });
      toast('✅'); go('request?id=' + r.request.id);
    } catch (e) { toast(e.message); b.disabled = false; }
  };
};

routes.request = async function (p) {
  spinner();
  const r = await api('getRequest', { id: p.id });
  const q = r.request, mgr = can('requestsManage'), types = t('reqTypes');
  let file = null;
  $app.innerHTML = `<div class="card"><div class="row"><div><span class="badge ${q.status.replace(/\s/g, '')}">${t('status_' + q.status.replace(/\s/g, ''))}</span> <span class="small muted">${esc(q.id)}</span></div></div>
      <h2 style="margin-top:8px">${esc(types[q.type] || q.type)} — ${esc(q.subject)}</h2>
      <div style="white-space:pre-wrap">${esc(q.message)}</div><div class="small muted" style="margin-top:6px">${esc(q.userName)} · ${fmtDT(q.createdAt)}</div>
      ${mgr ? `<div class="row wrap" style="margin-top:12px;gap:8px">${q.status !== 'In Progress' ? `<button class="btn sm ghost" data-s="In Progress">${t('markProgress')}</button>` : ''}${q.status !== 'Done' ? `<button class="btn sm" data-s="Done">${t('markDone')}</button>` : `<button class="btn sm ghost" data-s="Open">${t('reopen')}</button>`}</div>` : ''}
    </div>
    <div class="thread">${r.comments.map(c => `<div class="msg ${c.userId === state.user.id ? 'me' : ''}"><div class="who">${esc(c.userName)} · ${fmtDT(c.createdAt)}</div>
      ${c.message && c.message !== '(attachment)' ? `<div style="white-space:pre-wrap">${esc(c.message)}</div>` : ''}${c.fileId ? `<button class="btn sm ghost" data-open="${c.fileId}" style="margin-top:6px">📎 ${esc(c.fileName)}</button>` : ''}</div>`).join('')}</div>
    <div class="card"><textarea id="rep" placeholder="${t('reply')}" style="min-height:70px"></textarea>
      <div class="row" style="margin-top:8px"><label class="btn ghost sm" for="cf" style="flex:0 0 auto;margin:0">${t('attach')}</label><span id="cfn" class="small muted"></span><button id="sendRep" class="btn sm" style="flex:0 0 auto">${t('send')}</button></div>
      <input id="cf" type="file" accept="image/*,application/pdf" hidden></div>`;
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openFile(b.dataset.open, 'open'));
  document.querySelectorAll('[data-s]').forEach(b => b.onclick = async () => { await api('updateRequest', { id: q.id, status: b.dataset.s }); render(); });
  document.getElementById('cf').onchange = async e => { file = e.target.files[0] ? await compressImage(e.target.files[0]) : null; document.getElementById('cfn').textContent = file ? file.name : ''; };
  document.getElementById('sendRep').onclick = async () => {
    const msg = document.getElementById('rep').value.trim(); if (!msg && !file) return;
    const b = document.getElementById('sendRep'); b.disabled = true;
    try { await api('addComment', { requestId: q.id, message: msg, file: file ? await fileToPayload(file) : null }); render(); } catch (e) { toast(e.message); b.disabled = false; }
  };
};

routes.ledgers = async function (p) {
  let group = p.group || 'Sundry Debtors', timer;
  $app.innerHTML = `<h2>📒 ${t('ledgers')}</h2><div class="sticky-search"><input id="q" type="search" placeholder="${t('search')}"><div class="chips" id="grps"></div></div>
    <div class="card list" id="list"><div class="spinner"></div></div><div class="foot" id="sync"></div>`;
  const load = async () => {
    const r = await api('listLedgers', { q: document.getElementById('q').value, group });
    const show = ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts'].concat(r.groups.filter(g => ['Sundry Debtors', 'Sundry Creditors', 'Bank Accounts'].indexOf(g) < 0));
    document.getElementById('grps').innerHTML = show.filter(g => r.groups.indexOf(g) >= 0 || g === group).map(g => `<span class="chip ${g === group ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</span>`).join('') + `<span class="chip ${group === '' ? 'on' : ''}" data-g="">${t('all')}</span>`;
    document.querySelectorAll('#grps .chip').forEach(c => c.onclick = () => { group = c.dataset.g; load(); });
    document.getElementById('list').innerHTML = r.items.length ? r.items.map(l => `
      <a class="item" style="text-decoration:none;color:inherit" href="#ledger?name=${encodeURIComponent(l.name)}&company=${encodeURIComponent(l.company)}"><span class="ic">${l.group === 'Bank Accounts' ? '🏦' : l.group === 'Sundry Debtors' ? '🟢' : '📒'}</span>
        <div class="main"><div class="t">${esc(l.name)}</div><div class="s">${esc(l.parent)}</div></div><div class="amt ${l.closing >= 0 ? 'dr' : 'cr'}">${inr(l.closing)} ${drcr(l.closing)}</div></a>`).join('')
      : `<div class="center muted">${t('noData')}</div>`;
    document.getElementById('sync').textContent = r.syncedAt ? t('synced') + ': ' + fmtDT(r.syncedAt) : '';
  };
  document.getElementById('q').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 350); };
  await load();
};

routes.ledger = async function (p) {
  spinner();
  const r = await api('getLedger', { name: p.name, company: p.company, from: p.from, to: p.to });
  const L = r.ledger, rows = r.rows;
  const totDr = rows.reduce((s, x) => s + x.debit, 0), totCr = rows.reduce((s, x) => s + x.credit, 0);
  const last = rows.length ? rows[rows.length - 1].balance : L.opening;
  $app.innerHTML = `<div class="print-only lh"><div><b>Choudhary Enterprises</b><div class="small muted">Ledger Account · ${esc(L.name)}</div></div><div class="small" style="text-align:right">${p.from ? fmtDate(p.from) : 'From start'} – ${p.to ? fmtDate(p.to) : fmtDate(new Date().toISOString())}<br>Prepared by ${esc(CFG.FIRM_NAME)}</div></div>
    <div class="card"><h2 style="margin:0">${esc(L.name)}</h2><div class="small muted">${esc(L.group)} ${L.gstin ? '· GSTIN ' + esc(L.gstin) : ''}</div>
      <div class="kpis" style="margin-top:12px"><div class="kpi"><div class="l">${t('opening')}</div><div class="v">${inr(L.opening)} <small>${drcr(L.opening)}</small></div></div>
      <div class="kpi"><div class="l">${t('closing')}</div><div class="v">${inr(last)} <small>${drcr(last)}</small></div></div></div>
      <div class="row" style="margin-top:10px"><div><label>${t('from')}</label><input type="date" id="f" value="${esc(p.from || '')}"></div><div><label>${t('to')}</label><input type="date" id="tt" value="${esc(p.to || '')}"></div></div>
      <div class="row wrap no-print" style="margin-top:10px;gap:8px"><button id="apply" class="btn sm ghost">✓ ${t('from')}–${t('to')}</button><button id="shareSum" class="btn sm alt">${t('shareText')}</button><button id="prt" class="btn sm ghost">🖨️ ${t('print')}</button><a class="btn sm" href="#newrequest?type=Ledger&subject=${encodeURIComponent('Ledger: ' + L.name)}&message=${encodeURIComponent('DSC signed ledger required: ' + L.name + (p.from ? ' from ' + fmtDate(p.from) : '') + (p.to ? ' to ' + fmtDate(p.to) : ''))}">${t('askSigned')}</a></div></div>
    <div class="card" style="padding:0;overflow-x:auto"><table class="led"><thead><tr><th>Date</th><th>Particulars</th><th class="n">${t('dr')}</th><th class="n">${t('cr')}</th><th class="n">Bal</th></tr></thead><tbody>
      ${rows.map(x => `<tr><td>${fmtDate(x.date)}</td><td><b>${esc(x.other || x.vchType)}</b><div class="s muted">${esc(x.vchType)} ${esc(x.vchNo)}${x.narration ? ' · ' + esc(x.narration) : ''}</div></td><td class="n">${x.debit ? inr2(x.debit) : ''}</td><td class="n">${x.credit ? inr2(x.credit) : ''}</td><td class="n">${inr(x.balance)} ${drcr(x.balance)}</td></tr>`).join('') || `<tr><td colspan="5" class="center muted">${t('noData')}</td></tr>`}
      <tr><td></td><td><b>Total</b></td><td class="n"><b>${inr2(totDr)}</b></td><td class="n"><b>${inr2(totCr)}</b></td><td></td></tr></tbody></table></div>
    <div class="foot">${r.syncedAt ? t('synced') + ': ' + fmtDT(r.syncedAt) : ''}</div>`;
  document.getElementById('prt').onclick = () => window.print();
  document.getElementById('apply').onclick = () => go(`ledger?name=${encodeURIComponent(L.name)}&company=${encodeURIComponent(L.company)}&from=${document.getElementById('f').value}&to=${document.getElementById('tt').value}`);
  document.getElementById('shareSum').onclick = async () => {
    const txt = `📒 ${L.name}\n${p.from ? fmtDate(p.from) : ''}${p.to ? ' – ' + fmtDate(p.to) : ''}\n${t('opening')}: ${inr2(L.opening)} ${drcr(L.opening)}\n${t('dr')}: ${inr2(totDr)}\n${t('cr')}: ${inr2(totCr)}\n${t('closing')}: ${inr2(last)} ${drcr(last)}\n— ${CFG.FIRM_NAME}`;
    if (navigator.share) { try { await navigator.share({ text: txt }); } catch (e) {} } else { await navigator.clipboard.writeText(txt); toast('Copied'); }
  };
};

routes.dashboard = async function () {
  spinner();
  const d = await api('dashboard');
  $app.innerHTML = `<h2>📊 ${t('dashboard')}</h2>
    <div class="card"><h3 style="margin-top:0">🏦 ${t('bankBal')}</h3>${d.banks.map(b => `<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><div>${esc(b.name)}</div><div class="amt ${b.balance >= 0 ? '' : 'neg'}" style="text-align:right">${inr(b.balance)}${b.balance < 0 ? ' (OD)' : ''}</div></div>`).join('') || `<div class="muted">${t('noData')}</div>`}</div>
    <h3>📅 ${t('lastDay')}: ${fmtDate(d.lastDay.date)}</h3>
    <div class="kpis"><div class="kpi in"><div class="l">⬇️ ${t('inMoney')}</div><div class="v">${inr(d.lastDay.inTotal)}</div></div><div class="kpi out"><div class="l">⬆️ ${t('outMoney')}</div><div class="v">${inr(d.lastDay.outTotal)}</div></div></div>
    <div class="card list" style="margin-top:10px">${d.lastDay.items.map(x => `<div class="item"><span class="ic">${x.in ? '🟢' : '🔴'}</span><div class="main"><div class="t">${esc(x.party || x.vchType)}</div><div class="s">${esc(x.bank)}${x.narration ? ' · ' + esc(x.narration) : ''}</div></div><div class="amt ${x.in ? 'cr' : 'neg'}">${x.in ? '+' : '−'}${inr(x.in || x.out)}</div></div>`).join('') || `<div class="center muted">${t('noData')}</div>`}</div>
    <h3>🗓️ ${t('week')}</h3><div class="kpis"><div class="kpi in"><div class="l">${t('inMoney')}</div><div class="v">${inr(d.week.inTotal)}</div></div><div class="kpi out"><div class="l">${t('outMoney')}</div><div class="v">${inr(d.week.outTotal)}</div></div></div>
    <h3>📌 ${t('receivable')}: ${inr(d.debtorsTotal)}</h3>
    <div class="card list">${d.topDebtors.map(x => `<a class="item" style="text-decoration:none;color:inherit" href="#ledger?name=${encodeURIComponent(x.name)}"><span class="ic">🟢</span><div class="main"><div class="t">${esc(x.name)}</div></div><div class="amt">${inr(x.amount)}</div></a>`).join('') || `<div class="center muted">${t('noData')}</div>`}</div>
    <div class="kpis"><div class="kpi"><div class="l">${t('payable')}</div><div class="v">${inr(d.creditorsTotal)}</div></div><div class="kpi"><div class="l">${t('invMonth')}</div><div class="v">${d.invoicesThisMonth}</div></div>
      <a class="kpi" href="#requests" style="text-decoration:none;color:inherit"><div class="l">${t('pendingReq')}</div><div class="v">${d.openRequests}</div></a><a class="kpi" href="#uploads" style="text-decoration:none;color:inherit"><div class="l">${t('newUploadsK')}</div><div class="v">${d.newUploads}</div></a></div>
    <div class="foot">${d.syncedAt ? t('synced') + ': ' + fmtDT(d.syncedAt) : ''}</div>`;
};

routes.users = async function (p) {
  spinner();
  const r = await api('listUsers');
  const edit = p.id ? r.items.find(x => x.id === p.id) : (p.new ? { role: 'CLIENT_STAFF', active: 'Y' } : null);
  if (edit) {
    $app.innerHTML = `<h2>👥 ${esc(edit.name || t('addUser'))}</h2><div class="card">
      <label>${t('name')}</label><input id="n" value="${esc(edit.name || '')}">
      <label>${t('mobile')}</label><input id="m" type="tel" value="${esc(edit.mobile || '')}">
      <label>${t('email')}</label><input id="e" type="email" value="${esc(edit.email || '')}" placeholder="name@gmail.com">
      <label>${t('role')}</label><select id="r">${r.roles.map(x => `<option value="${x.key}" ${x.key === edit.role ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>
      <label>${t('site')}</label><input id="s" value="${esc(edit.site || '')}">
      <label>${t('setPin')} ${edit.hasPin ? '✅' : ''}</label><input id="pn" inputmode="numeric" maxlength="6">
      <label>${t('fuelPerm')}</label><select id="fe"><option value="N">${t('no')}</option><option value="Y" ${edit.fuelEntry === 'Y' ? 'selected' : ''}>${t('yes')}</option></select>
      <label>${t('activeQ')}</label><select id="a"><option value="Y">${t('yes')}</option><option value="N" ${edit.active === 'N' ? 'selected' : ''}>${t('no')}</option></select>
      <div style="height:14px"></div><button id="sv" class="btn block">${t('save')}</button></div>`;
    document.getElementById('sv').onclick = async () => {
      try { await api('saveUser', { user: { id: edit.id, name: v('n'), mobile: v('m'), email: v('e'), role: v('r'), site: v('s'), pin: v('pn'), active: v('a'), fuelEntry: v('fe') } }); toast('✅'); go('users'); } catch (e) { toast(e.message); }
    };
    return;
  }
  $app.innerHTML = `<h2>👥 ${t('users')}</h2><a class="btn alt block" href="#users?new=1">${t('addUser')}</a><div style="height:12px"></div>
    <div class="card list">${r.items.map(x => `<a class="item" style="text-decoration:none;color:inherit" href="#users?id=${x.id}"><span class="ic">${x.role === 'OWNER' ? '👑' : x.role.indexOf('FIRM') >= 0 || x.role === 'ADMIN' ? '🏢' : '👷'}</span>
      <div class="main"><div class="t">${esc(x.name)} ${x.active === 'N' ? '⛔' : ''}</div><div class="s">${esc(x.roleLabel)} · ${esc(x.mobile)} ${esc(x.email)} ${x.site ? '· ' + esc(x.site) : ''}</div><div class="s">${x.hasPin ? '🔢 PIN' : ''} ${x.email ? 'G Gmail' : ''} ${x.fuelEntry === 'Y' ? '⛽' : ''} ${x.lastLogin ? '· ' + fmtDT(x.lastLogin) : ''}</div></div></a>`).join('')}</div>`;
};
const v = id => document.getElementById(id).value.trim();

routes.profile = async function () {
  const u = state.user;
  $app.innerHTML = `<h2>⚙️ ${t('profile')}</h2><div class="card"><div class="mid">${esc(u.name)}</div><div class="muted">${esc(u.roleLabel)} · ${esc(u.mobile)} ${esc(u.email)}</div></div>
    <div class="card"><h3 style="margin-top:0">${t('language')}</h3><div class="chips"><span class="chip ${state.lang === 'hi' ? 'on' : ''}" data-l="hi">हिंदी</span><span class="chip ${state.lang === 'en' ? 'on' : ''}" data-l="en">English</span></div></div>
    <div class="card"><h3 style="margin-top:0">${t('changePin')}</h3>${u.hasPin ? `<label>${t('oldPin')}</label><input id="op" type="password" inputmode="numeric" maxlength="6">` : ''}
      <label>${t('newPin')}</label><input id="np" type="password" inputmode="numeric" maxlength="6"><div style="height:12px"></div><button id="cp" class="btn block">${t('save')}</button></div>
    ${installCard()}<button id="lo" class="btn danger block">${t('logout')}</button>`;
  bindInstall();
  document.querySelectorAll('[data-l]').forEach(c => c.onclick = () => { state.lang = c.dataset.l; store.set('lang', state.lang); store.set('langSet', true); render(); });
  document.getElementById('cp').onclick = async () => { try { await api('changePin', { oldPin: (document.getElementById('op') || {}).value, newPin: v('np') }); state.user.hasPin = true; store.set('user', state.user); toast('✅'); } catch (e) { toast(e.message); } };
  document.getElementById('lo').onclick = async () => { try { await api('logout'); } catch (e) {} logoutLocal(); render(); };
};


// ───────────── ⛽ Diesel — supervisor entry ─────────────
const F = { meta: store.get('fuelMeta', null), v: null, gps: null, photos: { meter: '', slip: '', pump: '' } };
routes.fuel = async function () {
  if (!can('fuelEntry')) return go('home');
  F.photos = { meter: '', slip: '', pump: '' }; F.v = null;
  $app.innerHTML = '<div class="spinner"></div>';
  try { F.meta = await api('fuelMeta'); store.set('fuelMeta', F.meta); } catch (e) { if (!F.meta) throw e; }
  const m = F.meta;
  if (!m.vehicles.length) { $app.innerHTML = `<div class="card center">⛽<br><b>अभी कोई गाड़ी दर्ज नहीं है</b><div class="small muted" style="margin-top:6px">ऑफ़िस से Vehicles लिस्ट भरवाएँ।</div></div>`; return; }
  $app.innerHTML = `
  <div class="card">
    <div class="sec"><b>1</b>गाड़ी</div>
    <label>साइट</label><select id="fSite">${m.sites.map(x => `<option value="${esc(x.code)}">${esc(x.name)} (${esc(x.code)})</option>`).join('')}</select>
    <label>गाड़ी नंबर</label><select id="fVeh"></select>
    <div id="fInfo" class="info3" hidden>
      <div class="pill"><small>पिछली रीडिंग</small><strong id="iPrev">—</strong></div>
      <div class="pill"><small>पिछली भराई</small><strong id="iLast" style="font-size:12px">—</strong></div>
      <div class="pill"><small>टंकी क्षमता</small><strong id="iTank">—</strong></div>
    </div>
    <div class="row"><div><label>ड्राइवर का नाम</label><input id="fDn" placeholder="पूरा नाम"></div><div><label>ड्राइवर मोबाइल</label><input id="fDm" type="tel" inputmode="numeric" maxlength="10" placeholder="10 अंक"></div></div>
  </div>
  <div class="card">
    <div class="sec"><b>2</b>मीटर और डीज़ल</div>
    <label id="fLblR">अभी की मीटर रीडिंग</label><input id="fRead" type="number" inputmode="decimal" placeholder="जैसे 45210">
    <div class="calc"><span>पिछली भराई से चली</span><strong id="fRun">—</strong></div>
    <div class="row"><div><label>डीज़ल (लीटर)</label><input id="fLit" type="number" inputmode="decimal" placeholder="0.00"></div><div><label>रेट (₹/लीटर)</label><input id="fRate" type="number" inputmode="decimal" placeholder="0.00" value="${esc(store.get('fuelRate', ''))}"></div></div>
    <label>कुल राशि (₹)</label><input id="fAmt" type="number" inputmode="decimal" placeholder="अपने-आप भरेगी">
    <div class="toggle"><div>टंकी फुल भराई?<small>फुल टंकी से ही सही एवरेज निकलता है</small></div><label class="switch"><input type="checkbox" id="fFull" checked><span class="slider"></span></label></div>
    <div class="row"><div><label>पंप का नाम</label><input id="fPump" list="fPumps" placeholder="पंप"><datalist id="fPumps"></datalist></div><div><label>स्लिप नंबर</label><input id="fSlip" placeholder="स्लिप पर लिखा नंबर"></div></div>
  </div>
  <div class="card">
    <div class="sec"><b>3</b>सबूत — फ़ोटो और लोकेशन</div>
    <div class="photos">
      <div class="shot" data-k="meter"><span class="tag r">ज़रूरी</span>🧭<br>मीटर / ओडोमीटर</div>
      <div class="shot" data-k="slip"><span class="tag r">ज़रूरी</span>🧾<br>पंप की स्लिप</div>
      <div class="shot" data-k="pump"><span class="tag o">वैकल्पिक</span>⛽<br>पंप डिस्प्ले</div>
    </div>
    <input type="file" id="fCam" accept="image/*" capture="environment" hidden>
    <p class="small muted">फ़ोटो पर गाड़ी नंबर, तारीख़-समय और लोकेशन अपने-आप छप जाएगी।</p>
    <label>लोकेशन</label><div class="gps wait" id="fGps"><span class="dot"></span><span id="fGpsT">लोकेशन ली जा रही है…</span></div>
    <label>टिप्पणी (वैकल्पिक)</label><textarea id="fRem" rows="2" style="min-height:60px" placeholder="कोई ख़ास बात"></textarea>
  </div>
  <button id="fSave" class="btn gold block">✓ एंट्री सेव करें</button>`;
  const $ = id => document.getElementById(id);
  const onSite = () => {
    const code = $('fSite').value, vs = m.vehicles.filter(v => v.site === code), site = m.sites.find(x => x.code === code) || {};
    $('fVeh').innerHTML = '<option value="">— गाड़ी चुनें —</option>' + vs.map(v => `<option value="${esc(v.no)}">${esc(v.no)}${v.type ? ' · ' + esc(v.type) : ''}</option>`).join('');
    $('fPumps').innerHTML = (site.pumps || []).map(x => `<option value="${esc(x)}">`).join('');
    if ((site.pumps || []).length === 1) $('fPump').value = site.pumps[0];
    $('fInfo').hidden = true; F.v = null; calc();
  };
  const calc = () => {
    const lit = parseFloat($('fLit').value), rate = parseFloat($('fRate').value);
    if (lit > 0 && rate > 0) $('fAmt').value = (lit * rate).toFixed(2);
    let txt = '—'; const cur = parseFloat($('fRead').value);
    if (F.v && !isNaN(cur)) txt = F.v.first ? 'पहली एंट्री' : ((cur - F.v.prev).toFixed(1) + (F.v.meter === 'HR' ? ' घंटे' : ' km'));
    $('fRun').textContent = txt;
  };
  $('fSite').onchange = onSite;
  $('fVeh').onchange = async () => {
    const no = $('fVeh').value; if (!no) { $('fInfo').hidden = true; F.v = null; return; }
    const vm = m.vehicles.find(v => v.no === no);
    $('fLblR').textContent = vm.meter === 'HR' ? 'अभी की घंटा मीटर (HMR) रीडिंग' : 'अभी की ओडोमीटर (KM) रीडिंग';
    try { F.v = await api('fuelVehicleStatus', { vehicle: no }); $('fInfo').hidden = false;
      $('iPrev').textContent = Number(F.v.prev).toLocaleString('en-IN') + (F.v.meter === 'HR' ? ' hr' : ' km'); $('iLast').textContent = F.v.lastAt; $('iTank').textContent = (F.v.tank || '—') + ' L';
    } catch (e) { F.v = null; toast('📶 ऑफ़लाइन — पिछली रीडिंग बाद में मिलाई जाएगी'); }
    calc();
  };
  ['fRead', 'fLit', 'fRate'].forEach(id => $(id).oninput = calc);
  let shotKey = '';
  document.querySelectorAll('.shot').forEach(el => el.onclick = () => { shotKey = el.dataset.k; $('fCam').click(); });
  $('fCam').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { F.photos[shotKey] = await stampPhoto(f, $('fVeh').value); const el = document.querySelector(`.shot[data-k="${shotKey}"]`); el.classList.add('done');
      el.querySelector('img') && el.querySelector('img').remove(); const im = new Image(); im.src = F.photos[shotKey]; el.appendChild(im);
    } catch (err) { toast('फ़ोटो नहीं ली जा सकी'); }
  };
  getGps();
  onSite();
  $('fSave').onclick = async () => {
    const pl = { vehicle: $('fVeh').value, driverName: $('fDn').value.trim(), driverMobile: $('fDm').value.trim(), reading: $('fRead').value, litres: $('fLit').value, rate: $('fRate').value,
      amount: $('fAmt').value, fullTank: $('fFull').checked, pump: $('fPump').value.trim(), slipNo: $('fSlip').value.trim(), remarks: $('fRem').value.trim(),
      lat: F.gps ? F.gps.lat : '', lng: F.gps ? F.gps.lng : '', acc: F.gps ? F.gps.acc : '', photos: F.photos, phoneTs: new Date().toISOString(), clientId: 'F' + Date.now() + Math.random().toString(36).slice(2, 7) };
    if (!pl.vehicle) return toast('गाड़ी चुनें');
    if (!pl.driverName) return toast('ड्राइवर का नाम डालें');
    if (pl.reading === '') return toast('मीटर रीडिंग डालें');
    if (!(parseFloat(pl.litres) > 0)) return toast('डीज़ल लीटर डालें');
    if (!F.photos.meter) return toast('मीटर की फ़ोटो लें');
    if (!F.photos.slip) return toast('पंप स्लिप की फ़ोटो लें');
    if (!F.gps && !confirm('लोकेशन नहीं मिली है। फिर भी सेव करें? (यह एंट्री जाँच में जाएगी)')) return;
    if (pl.rate) store.set('fuelRate', pl.rate);
    const b = $('fSave'); b.disabled = true; b.textContent = 'सेव हो रहा है…';
    try { if (!navigator.onLine) throw new TypeError('offline'); const r = await api('fuelSave', pl); fuelDone(r, false); }
    catch (e) { if (e instanceof TypeError || !navigator.onLine) { await Q.add({ action: 'fuelSave', payload: pl, at: Date.now() }); refreshQueueBar(); fuelDone({ id: '(नेटवर्क आने पर)', amount: pl.amount, vehicle: pl.vehicle, litres: pl.litres, pump: pl.pump }, true); }
      else { toast(e.message); b.disabled = false; b.textContent = '✓ एंट्री सेव करें'; } }
  };
};
function fuelDone(r, queued) {
  const m = F.meta || {};
  $app.innerHTML = `<div class="card" style="text-align:center"><div class="tick">✓</div><h2 style="margin:0">${queued ? 'एंट्री फ़ोन में सुरक्षित' : 'एंट्री सेव हो गई'}</h2>
    <p class="muted">${queued ? 'नेटवर्क आते ही अपने-आप चली जाएगी, तब Entry ID मिलेगा।' : 'अब पेमेंट के लिए नीचे वाला बटन दबाएँ'}</p>
    <div class="idbox"><small>ENTRY ID</small><strong>${esc(r.id)}</strong></div>
    <div class="kpis" style="text-align:left"><div class="kpi"><div class="l">गाड़ी · डीज़ल</div><div class="v" style="font-size:16px">${esc(r.vehicle)} · ${esc(r.litres)} L</div></div><div class="kpi gold"><div class="l">राशि</div><div class="v">${inr2(r.amount)}</div></div></div>
    ${queued ? '' : `<button id="wa" class="btn wa block" style="margin-top:14px">WhatsApp पर पेमेंट रिक्वेस्ट भेजें</button>`}
    <a class="btn ghost block" style="margin-top:10px" href="#fuel?n=${Date.now()}">+ अगली एंट्री</a>
    <div class="rule">🔒 <b>नियम:</b> बिना ऐप एंट्री के डीज़ल का पेमेंट नहीं होगा। पेमेंट रिक्वेस्ट में Entry ID होना ज़रूरी है।</div></div>`;
  const wa = document.getElementById('wa');
  if (wa) wa.onclick = () => { const msg = `*⛽ डीज़ल पेमेंट रिक्वेस्ट*\nEntry ID: *${r.id}*\nगाड़ी: ${r.vehicle}\nडीज़ल: ${r.litres} L\nराशि: *₹${Number(r.amount).toLocaleString('en-IN')}*\nपंप: ${r.pump || '-'}\nसुपरवाइज़र: ${state.user.name}`;
    window.open('https://wa.me/' + (m.payWa || '') + '?text=' + encodeURIComponent(msg), '_blank'); };
}
function getGps() {
  const g = document.getElementById('fGps'); if (!g) return; F.gps = null;
  g.className = 'gps wait'; g.innerHTML = '<span class="dot"></span><span>लोकेशन ली जा रही है…</span>';
  const bad = m => { g.className = 'gps bad'; g.innerHTML = `<span class="dot"></span><span>${m}</span><a id="gpsRetry">फिर कोशिश</a>`; document.getElementById('gpsRetry').onclick = getGps; };
  if (!navigator.geolocation) return bad('इस फ़ोन में लोकेशन उपलब्ध नहीं');
  navigator.geolocation.getCurrentPosition(p => { F.gps = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
    g.className = 'gps ok'; g.innerHTML = `<span class="dot"></span><span>लोकेशन मिल गई · ±${F.gps.acc} मीटर</span>`; }, () => bad('लोकेशन नहीं मिली — फ़ोन का GPS चालू करें'), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}
function stampPhoto(file, veh) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height, max = 1280;
      if (w >= h && w > max) { h = Math.round(h * max / w); w = max; } else if (h > max) { w = Math.round(w * max / h); h = max; }
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
      const bar = Math.max(30, Math.round(w * 0.035)); x.fillStyle = 'rgba(11,31,58,.8)'; x.fillRect(0, h - bar, w, bar);
      x.fillStyle = '#E6C674'; x.font = '700 ' + Math.round(bar * 0.46) + 'px Inter, sans-serif';
      x.fillText('CE FUEL · ' + (veh || '') + ' · ' + new Date().toLocaleString('en-IN') + (F.gps ? ' · ' + F.gps.lat.toFixed(5) + ', ' + F.gps.lng.toFixed(5) : ' · NO GPS'), 12, h - Math.round(bar * 0.32));
      URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}

// ───────────── 🛡️ Diesel control room (Owner / Admin / Firm staff) ─────────────
routes.fuelroom = async function (p) {
  if (!can('fuelView')) return go('home');
  spinner();
  const month = p.m || new Date().toISOString().slice(0, 7);
  const d = await api('fuelDashboard', { month, site: p.site || '' });
  const k = d.kpi, unit = m => m === 'HR' ? ' L/hr' : ' km/L';
  const photoLinks = x => `<span class="links">${x.meterPhoto ? `<a data-ph="${x.meterPhoto}">मीटर</a>` : ''}${x.slipPhoto ? `<a data-ph="${x.slipPhoto}">स्लिप</a>` : ''}${x.pumpPhoto ? `<a data-ph="${x.pumpPhoto}">पंप</a>` : ''}</span>`;
  const max = Math.max(1, ...d.daily.map(x => x.l));
  $app.innerHTML = `
    <div class="print-only lh"><div><b>Choudhary Enterprises</b><div class="small muted">Diesel Control Report · ${esc(d.month)}</div></div><div class="small">${esc(d.generated)}<br>System by ${esc(CFG.FIRM_NAME)}</div></div>
    <h2>🛡️ ${t('fuelRoom')}</h2>
    <div class="row wrap no-print" style="margin-bottom:12px"><input type="month" id="fm" value="${esc(d.month)}" style="flex:1 1 150px"><select id="fs" style="flex:1 1 150px"><option value="">सभी साइट</option>${d.sites.map(x => `<option value="${esc(x.code)}" ${x.code === p.site ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select><button id="fp" class="btn sm ghost" style="flex:0 0 auto">🖨️ ${t('print')}</button></div>
    ${d.setup.vehicles ? '' : `<div class="health warn"><span class="dot"></span>अभी Vehicles शीट खाली है — गाड़ियाँ, टंकी क्षमता और मानक एवरेज भरें।</div>`}
    <div class="kpis">
      <div class="kpi gold"><div class="l">कुल डीज़ल</div><div class="v">${Math.round(k.litres).toLocaleString('en-IN')} L</div></div>
      <div class="kpi"><div class="l">कुल खर्च · ₹${k.rate}/L</div><div class="v">${inr(k.amount)}</div></div>
      <div class="kpi" style="--c:#3B82F6"><div class="l">भराई · WATCH ${k.watch}</div><div class="v">${k.entries}</div></div>
      <div class="kpi out"><div class="l">RED अलर्ट</div><div class="v">${k.red}</div></div>
      <div class="kpi" style="--c:#6366F1;grid-column:1/-1"><div class="l">पेंडिंग पेमेंट · ${k.pendingCount} एंट्री</div><div class="v">${inr(k.pendingAmt)}</div></div>
    </div>
    <h3>गाड़ी-वार रिस्क रडार</h3>
    <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>गाड़ी</th><th class="n">भराई</th><th class="n">लीटर</th><th class="n">मीटर रन</th><th class="n">GPS रन</th><th class="n">अंतर</th><th class="n">एवरेज</th><th class="n">मानक</th><th class="n">विचलन</th><th>स्थिति</th></tr></thead><tbody>
      ${d.vehicles.map(v => { const bad = v.dev !== '' && ((v.meter === 'KM' && v.dev < 0) || (v.meter === 'HR' && v.dev > 0));
        return `<tr><td><b>${esc(v.no)}</b><div class="small muted">${esc(v.type)} · ${esc(v.site)}</div></td><td class="n">${v.fills}</td><td class="n">${v.litres}</td><td class="n">${v.run}</td><td class="n">${v.gps || '—'}</td>
        <td class="n">${v.gap !== '' ? `<span class="dev ${Math.abs(v.gap) > 10 ? 'bad' : 'good'}">${v.gap > 0 ? '+' : ''}${v.gap}%</span>` : '—'}</td><td class="n">${v.avg !== '' ? v.avg + '<span class="small muted">' + unit(v.meter) + '</span>' : '—'}</td><td class="n">${v.std || '—'}</td>
        <td class="n">${v.dev !== '' ? `<span class="dev ${bad ? 'bad' : 'good'}">${v.dev > 0 ? '+' : ''}${v.dev}%</span>` : '—'}</td><td><span class="badge ${v.status}">${v.status === 'RED' ? 'संदिग्ध' : 'सामान्य'}</span></td></tr>`; }).join('') || `<tr><td colspan="10" class="center muted">इस महीने कोई एंट्री नहीं</td></tr>`}
    </tbody></table></div></div>
    <h3>रोज़ का डीज़ल (लीटर)</h3>
    <div class="card"><div class="chart">${d.daily.map(x => `<div class="col" title="${x.d} — ${x.l} L"><div style="height:${Math.round(x.l / max * 100)}%"></div><span>${x.d}</span></div>`).join('') || '<div class="muted" style="margin:auto">डेटा नहीं</div>'}</div></div>
    <h3>अलर्ट (RED / WATCH)</h3>
    <div>${d.alerts.map(x => `<div class="alert ${x.risk}"><div class="row"><div><b>${esc(x.vehicle)}</b> <span class="small muted">· ${esc(x.id)} · ${fmtDT(x.ts)}</span></div><span class="badge ${x.risk}" style="flex:0 0 auto">${x.risk}</span></div><ul>${x.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul><div class="small muted">${x.litres} L · ${inr(x.amount)} · सुपरवाइज़र: ${esc(x.sup)}</div><div style="margin-top:6px">${photoLinks(x)}</div></div>`).join('') || '<div class="card center muted">✅ कोई अलर्ट नहीं</div>'}</div>
    <h3>पेंडिंग पेमेंट</h3>
    <div class="card list">${d.pending.map(x => `<div class="item" style="cursor:default"><span class="ic">⛽</span><div class="main"><div class="t">${esc(x.id)} · ${esc(x.vehicle)}</div><div class="s">${fmtDT(x.ts)} · ${esc(x.pump)} ${x.slip ? '· स्लिप ' + esc(x.slip) : ''} · ${x.litres} L</div><div style="margin-top:4px">${photoLinks(x)} <span class="badge ${x.risk}">${x.risk}</span></div></div><div style="text-align:right"><div class="amt">${inr(x.amount)}</div>${can('fuelPay') ? `<button class="btn sm" data-pay="${esc(x.id)}" data-amt="${x.amount}" data-risk="${x.risk}" style="margin-top:6px">Paid ✓</button>` : ''}</div></div>`).join('') || '<div class="center muted">कोई पेंडिंग पेमेंट नहीं</div>'}</div>
    <h3>सभी एंट्री</h3>
    <div class="card" style="padding:0"><div class="tw"><table class="led"><thead><tr><th>Entry</th><th>गाड़ी</th><th class="n">पिछली</th><th class="n">अभी</th><th class="n">रन</th><th class="n">लीटर</th><th class="n">राशि</th><th class="n">एवरेज</th><th>रिस्क</th><th>पेमेंट</th></tr></thead><tbody>
      ${d.entries.map(x => `<tr><td><b>${esc(x.id)}</b><div class="small muted">${fmtDT(x.ts)} · ${esc(x.driver)}</div></td><td>${esc(x.vehicle)}</td><td class="n">${x.prev}</td><td class="n">${x.cur}</td><td class="n">${x.run}</td><td class="n">${x.litres}</td><td class="n">${inr(x.amount)}</td><td class="n">${x.avg !== '' ? x.avg : '—'}</td><td><span class="badge ${x.risk}">${x.risk}</span></td><td><span class="badge ${x.pay}">${x.pay}</span></td></tr>`).join('') || `<tr><td colspan="10" class="center muted">कोई एंट्री नहीं</td></tr>`}
    </tbody></table></div></div>
    <div class="foot">रिपोर्ट समय: ${esc(d.generated)} · System by <b>${esc(CFG.FIRM_NAME)}</b></div>`;
  const nav = () => go(`fuelroom?m=${document.getElementById('fm').value}&site=${encodeURIComponent(document.getElementById('fs').value)}`);
  document.getElementById('fm').onchange = nav; document.getElementById('fs').onchange = nav;
  document.getElementById('fp').onclick = () => window.print();
  document.querySelectorAll('[data-ph]').forEach(a => a.onclick = () => openFile(a.dataset.ph, 'open'));
  document.querySelectorAll('[data-pay]').forEach(b => b.onclick = async () => {
    if (b.dataset.risk === 'RED' && !confirm('⚠ यह RED अलर्ट वाली एंट्री है। फ़ोटो जाँच ली? फिर भी Paid करें?')) return;
    const utr = prompt(`Entry ${b.dataset.pay} · ${inr(b.dataset.amt)}\nUTR / रेफ़रेंस नंबर डालें:`); if (utr === null) return;
    try { await api('fuelMarkPaid', { id: b.dataset.pay, utr }); toast('Paid ✓ दर्ज हुआ'); render(); } catch (e) { toast(e.message); }
  });
};

// ───────────── Install prompt ─────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
function installCard() { if (window.matchMedia('(display-mode: standalone)').matches) return ''; return `<div class="card small">${t('installHint')}${deferredPrompt ? `<div style="height:8px"></div><button id="inst" class="btn sm alt">${t('install')}</button>` : ''}</div>`; }
function bindInstall() { const b = document.getElementById('inst'); if (b) b.onclick = async () => { deferredPrompt.prompt(); deferredPrompt = null; b.remove(); }; }

// ───────────── DEMO backend (only when API_URL is empty) ─────────────
const Demo = (function () {
  const users = {
    OWNER: { id: 'U1', name: 'Choudhary ji', mobile: '9001909999', email: '', role: 'OWNER', roleLabel: 'Owner (Choudhary ji)', site: 'Head Office', perms: ['invoices', 'upload', 'uploadsAll', 'requestsAll', 'ledgers', 'dashboard', 'fuelView'], hasPin: true },
    CLIENT_STAFF: { id: 'U2', name: 'Supervisor Talasari', mobile: '9876500001', email: '', role: 'CLIENT_STAFF', roleLabel: 'Site Staff', site: 'TLS', perms: ['invoices', 'upload', 'fuelEntry'], hasPin: true, fuelEntry: 'Y' },
    ADMIN: { id: 'U3', name: 'Chandresh Jagetia', mobile: '', email: 'admin@example.com', role: 'ADMIN', roleLabel: 'Admin (P Jagetia & Associates)', site: 'Office', perms: ['invoices', 'upload', 'uploadsAll', 'uploadsReview', 'requestsAll', 'requestsManage', 'ledgers', 'dashboard', 'users', 'fuelEntry', 'fuelView', 'fuelPay', 'syncHealth'], hasPin: false, fuelEntry: 'Y' },
    FIRM_STAFF: { id: 'U4', name: 'Office Staff', mobile: '9876500002', email: '', role: 'FIRM_STAFF', roleLabel: 'Firm Staff', site: 'Office', perms: ['invoices', 'upload', 'uploadsAll', 'uploadsReview', 'requestsAll', 'requestsManage', 'ledgers', 'dashboard', 'fuelView', 'fuelPay'], hasPin: true }
  };
  const invoices = [
    ['CE-GJ-118 Shrinathji Stone Quarry Oct-2026.pdf', 'SALE / GUJARAT / 10 OCT', '2026-27'], ['CE-RJ-245 Rb Ghodke Infrastructure Oct-2026.pdf', 'SALE / RAJASTHAN / 10 OCT', '2026-27'],
    ['CE-MH-077 Shri Balaji Mining Sep-2026.pdf', 'SALE / MAHARASHTRA / 09 SEP', '2026-27'], ['CE-GJ-112 Atik Sep-2026.pdf', 'SALE / GUJARAT / 09 SEP', '2026-27'],
    ['CE-GJ-109 Shree Ganesh Stone Trading Aug-2026.pdf', 'SALE / GUJARAT / 08 AUG', '2026-27'], ['CE-RJ-310 Rb Ghodke Infrastructure Mar-2026.pdf', 'SALE / RAJASTHAN / 03 MAR', '2025-26']
  ].map((x, i) => ({ fileId: 'F' + i, name: x[0], path: x[1], fy: x[2], sizeKB: 180 + i * 7, modified: '2026-11-0' + (9 - i) }));
  const ledgers = [
    { company: 'Choudhary Enterprises', name: 'Rb Ghodke Infrastructure', group: 'Sundry Debtors', parent: 'Company', closing: 1845600 },
    { company: 'Choudhary Enterprises', name: 'Shrinathji Stone Quarry (Prop. Demo Name)', group: 'Sundry Debtors', parent: 'Proprietorship', closing: 962400 },
    { company: 'Choudhary Enterprises', name: 'Atik', group: 'Sundry Debtors', parent: 'Partnership Firm', closing: 538250 },
    { company: 'Choudhary Enterprises', name: 'Agarwal Auto Agencies', group: 'Sundry Creditors', parent: 'Proprietorship', closing: -214500 },
    { company: 'Choudhary Enterprises', name: 'HDFC Bank CA Buldhana', group: 'Bank Accounts', parent: 'Bank Accounts', closing: 2310450 },
    { company: 'Choudhary Enterprises', name: 'MGB Bank', group: 'Bank Accounts', parent: 'Bank Accounts', closing: 84200 }
  ];
  let uploads = [{ id: 'UP1', userId: 'U2', userName: 'Site Munim (Atik)', site: 'Atik Site', docType: 'Diesel Slip', partyName: 'Indian Oil Pump', billNo: '4471', billDate: '2026-11-14', amount: '48500', note: '', fileId: 'F0', status: 'New', uploadedAt: '2026-11-14T17:40:00' },
    { id: 'UP2', userId: 'U2', userName: 'Site Munim (Atik)', site: 'Atik Site', docType: 'Purchase Bill', partyName: 'Gold Fields', billNo: 'GF/1189', billDate: '2026-11-12', amount: '126400', note: 'Machine parts', fileId: 'F1', status: 'Filed', reviewNote: '', uploadedAt: '2026-11-12T12:10:00' }];
  let requests = [{ id: 'RQ1', userId: 'U1', userName: 'Choudhary ji', type: 'Payment', subject: 'Rb Ghodke ka payment kab tak aaya?', message: 'October tak ka hisab batao', status: 'In Progress', createdAt: '2026-11-15T09:20:00', updatedAt: '2026-11-15T10:05:00' },
    { id: 'RQ2', userId: 'U2', userName: 'Site Munim (Atik)', type: 'Invoice', subject: 'Atik ka Sep bill chahiye', message: '', status: 'Done', createdAt: '2026-11-13T11:00:00', updatedAt: '2026-11-13T11:30:00' }];
  let comments = [{ id: 'C1', requestId: 'RQ1', userId: 'U3', userName: 'Chandresh Jagetia', message: '14-11-2026 tak ₹12,40,000 aa gaya hai. Ledger bhej rahe hain.', createdAt: '2026-11-15T10:05:00' }];
  let me = users[store.get('demoRole', 'OWNER')] || users.OWNER;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  return {
    setRole(r) { me = users[r]; store.set('demoRole', r); state.user = me; store.set('user', me); },
    async call(a, b) {
      await wait(250);
      const ok = o => Object.assign({ ok: true }, o);
      switch (a) {
        case 'loginPin': case 'loginGoogle': return ok({ token: 'demo', user: me });
        case 'logout': case 'changePin': case 'reviewUpload': case 'saveUser': return ok({});
        case 'listInvoices': { const q = (b.q || '').toLowerCase(); return ok({ items: invoices.filter(i => (!b.fy || i.fy === b.fy) && (i.name + i.path).toLowerCase().includes(q)), total: 6, fys: ['2026-27', '2025-26'] }); }
        case 'getFile': throw new Error(state.lang === 'hi' ? 'DEMO: असली app में यहाँ PDF खुलेगा / WhatsApp पर जाएगा' : 'DEMO: the real app opens / shares the PDF here');
        case 'uploadDoc': { const u = Object.assign({ id: 'UP' + Date.now(), userId: me.id, userName: me.name, fileId: 'F0', status: 'New', uploadedAt: new Date().toISOString().slice(0, 19) }, b); delete u.file; uploads.unshift(u); return ok({ upload: u }); }
        case 'listUploads': return ok({ items: uploads.filter(u => me.perms.includes('uploadsAll') || u.userId === me.id) });
        case 'listRequests': return ok({ items: requests.filter(r => (me.perms.includes('requestsAll') || r.userId === me.id) && (b.status === 'active' ? r.status !== 'Done' : !b.status || r.status === b.status)) });
        case 'createRequest': { const r = { id: 'RQ' + Date.now(), userId: me.id, userName: me.name, type: b.type, subject: b.subject, message: b.message, status: 'Open', createdAt: new Date().toISOString().slice(0, 19), updatedAt: new Date().toISOString().slice(0, 19) }; requests.unshift(r); return ok({ request: r }); }
        case 'getRequest': return ok({ request: requests.find(r => r.id === b.id), comments: comments.filter(c => c.requestId === b.id) });
        case 'addComment': comments.push({ id: 'C' + Date.now(), requestId: b.requestId, userId: me.id, userName: me.name, message: b.message, createdAt: new Date().toISOString().slice(0, 19) }); return ok({});
        case 'updateRequest': requests.find(r => r.id === b.id).status = b.status; return ok({});
        case 'listLedgers': { const q = (b.q || '').toLowerCase(); return ok({ items: ledgers.filter(l => (!b.group || l.group === b.group) && l.name.toLowerCase().includes(q)), groups: ['Bank Accounts', 'Sundry Creditors', 'Sundry Debtors'], syncedAt: '2026-11-15T07:00:00' }); }
        case 'getLedger': {
          const L = ledgers.find(l => l.name === b.name) || ledgers[0];
          const rows = [{ date: '2026-10-01', vchType: 'Sales', vchNo: 'CE-RJ-231', debit: 950000, credit: 0, other: 'Site Preparation Services', narration: 'Being invoice for Sep-2026' }, { date: '2026-10-20', vchType: 'Receipt', vchNo: '88', debit: 0, credit: 600000, other: 'HDFC Bank CA Buldhana', narration: 'NEFT' }, { date: '2026-10-31', vchType: 'Sales', vchNo: 'CE-RJ-245', debit: 1220000, credit: 0, other: 'Site Preparation Services', narration: 'Being invoice for Oct-2026' }, { date: '2026-11-14', vchType: 'Receipt', vchNo: '102', debit: 0, credit: 640000, other: 'HDFC Bank CA Buldhana', narration: 'RTGS' }];
          let bal = 915600; rows.forEach(r => { bal += r.debit - r.credit; r.balance = bal; });
          return ok({ ledger: { company: L.company, name: L.name, group: L.group, opening: 915600, closing: L.closing, gstin: '08ABCDE1234F1Z5' }, rows, syncedAt: '2026-11-15T07:00:00' });
        }
        case 'dashboard': return ok({ syncedAt: '2026-11-15T07:00:00', banks: [{ name: 'HDFC Bank CA Buldhana', balance: 2310450 }, { name: 'MGB Bank', balance: 84200 }], lastDay: { date: '2026-11-14', inTotal: 640000, outTotal: 287300, items: [{ bank: 'HDFC Bank CA Buldhana', party: 'Rb Ghodke Infrastructure', in: 640000, out: 0, narration: 'RTGS' }, { bank: 'HDFC Bank CA Buldhana', party: 'Indian Oil Pump', in: 0, out: 148300, narration: 'Diesel' }, { bank: 'HDFC Bank CA Buldhana', party: 'Tata Capital EMI', in: 0, out: 139000, narration: 'EMI' }] }, week: { inTotal: 1890000, outTotal: 1214500 }, debtorsTotal: 3346250, topDebtors: ledgers.filter(l => l.group === 'Sundry Debtors').map(l => ({ name: l.name, amount: l.closing })), creditorsTotal: 214500, invoicesThisMonth: 4, sync: { time: '2026-11-21T08:00:12', status: 'OK', note: 'all 595 ledgers match Tally closing', ledgers: 828, entries: 10302, ageMin: 42 }, fuel: me.perms.includes('fuelView') ? { todayL: 410, todayAmt: 37720, todayN: 3, monthL: 18640, monthAmt: 1714880, red: 2, pendingAmt: 92400, pendingN: 4 } : null, openRequests: requests.filter(r => r.status !== 'Done').length, newUploads: uploads.filter(u => u.status === 'New').length });
        case 'listUsers': return ok({ items: Object.values(users).map(u => Object.assign({ active: 'Y' }, u)), roles: Object.keys(users).map(k => ({ key: k, label: users[k].roleLabel })) });
        case 'fuelMeta': return ok({ sites: [{ code: 'TLS', name: 'Talasari Site', pumps: ['Shree Petroleum'] }], vehicles: [{ no: 'MH48AB1234', type: 'Dumper', site: 'TLS', meter: 'KM', tank: 300 }, { no: 'MH48CD5678', type: 'Dumper', site: 'TLS', meter: 'KM', tank: 300 }, { no: 'EX-210', type: 'Excavator', site: 'TLS', meter: 'HR', tank: 400 }], payWa: '918005535005' });
        case 'fuelVehicleStatus': return ok({ prev: 45120, first: false, meter: b.vehicle === 'EX-210' ? 'HR' : 'KM', tank: 300, lastAt: '20 Nov 2026, 06:40 PM' });
        case 'fuelSave': return ok({ id: 'CE-261121-0042', amount: b.amount, vehicle: b.vehicle, litres: b.litres, pump: b.pump });
        case 'fuelMarkPaid': return ok({});
        case 'fuelDashboard': {
          const e = (id, v, lit, amt, risk, flags, pay, avg) => ({ id, ts: '2026-11-' + id.slice(-2) + 'T09:15:00', vehicle: v, driver: 'Ramesh', prev: 45000, cur: 45350, run: 350, litres: lit, amount: amt, avg, risk, flags, pay, pump: 'Shree Petroleum', slip: '88' + id.slice(-2), sup: 'Supervisor Talasari', meterPhoto: 'x', slipPhoto: 'x' });
          const entries = [e('CE-261120-0019', 'MH48CD5678', 210, 19320, 'RED', ['एवरेज 1.67 km/L — मानक 3 से कम', 'पंप से 6.4 km दूर से एंट्री'], 'PENDING', 1.67), e('CE-261120-0018', 'MH48AB1234', 120, 11040, 'WATCH', ['पिछली भराई के सिर्फ़ 5.2 घंटे बाद दोबारा'], 'PENDING', 2.9), e('CE-261119-0017', 'EX-210', 180, 16560, 'OK', [], 'PAID', 14.2), e('CE-261118-0016', 'MH48AB1234', 115, 10580, 'OK', [], 'PAID', 3.1)];
          return ok({ month: b.month, kpi: { litres: 18640, amount: 1714880, entries: 64, red: 2, watch: 5, pendingAmt: 92400, pendingCount: 4, rate: 92 }, vehicles: [{ no: 'MH48CD5678', type: 'Dumper', site: 'TLS', meter: 'KM', fills: 18, litres: 4210, amount: 387320, run: 7150, avg: 1.7, std: 3, dev: -43.3, gps: 9120, gap: -21.6, red: 2, status: 'RED' }, { no: 'MH48AB1234', type: 'Dumper', site: 'TLS', meter: 'KM', fills: 21, litres: 3890, amount: 357880, run: 11500, avg: 2.96, std: 3, dev: -1.3, gps: 11620, gap: -1, red: 0, status: 'OK' }, { no: 'EX-210', type: 'Excavator', site: 'TLS', meter: 'HR', fills: 12, litres: 2650, amount: 243800, run: 188, avg: 14.1, std: 15, dev: -6, gps: '', gap: '', red: 0, status: 'OK' }],
            daily: Array.from({ length: 20 }, (_, i) => ({ d: String(i + 1).padStart(2, '0'), l: 700 + ((i * 137) % 500) })), entries, alerts: entries.filter(x => x.risk !== 'OK'), pending: entries.filter(x => x.pay !== 'PAID'), sites: [{ code: 'TLS', name: 'Talasari Site' }], setup: { vehicles: 3, sites: 1 }, generated: '21 Nov 2026, 09:30 AM' });
        }
        default: return ok({});
      }
    }
  };
})();
function renderDemoBar() {
  const bar = document.getElementById('demoBar');
  if (!DEMO) { bar.hidden = true; return; }
  bar.hidden = false;
  const r = state.user ? state.user.role : store.get('demoRole', 'OWNER');
  bar.innerHTML = `${t('demo')} <select id="demoRole">${['OWNER', 'CLIENT_STAFF', 'FIRM_STAFF', 'ADMIN'].map(k => `<option ${k === r ? 'selected' : ''} value="${k}">${k}</option>`).join('')}</select>`;
  document.getElementById('demoRole').onchange = e => { Demo.setRole(e.target.value); if (!state.token) { state.token = 'demo'; store.set('token', 'demo'); } go('home'); render(); };
}

// ───────────── Boot ─────────────
// shared helpers for add-on modules (labour.js …)
window.CE = { api, routes, state, t, esc, inr, inr2, fmtDate, fmtDT, can, toast, spinner, go, render, Q, refreshQueueBar, openFile, store, CFG };
if ('serviceWorker' in navigator && !DEMO && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
const boot = () => render();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
// Refresh role/permissions from the server on every open, so changes reach users without re-login
if (state.token && !DEMO) api('me').then(r => { if (r && r.user) { state.user = r.user; store.set('user', r.user); render(); } }).catch(() => {});
flushQueue();
setInterval(flushQueue, 60000);
})();
