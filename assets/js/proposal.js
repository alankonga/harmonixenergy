/* Proposal builder: fill the form, preview the document live, print or save as PDF. */
(function () {
  "use strict";
  var H = window.HX, P = H.proposal, $ = function (id) { return document.getElementById(id); };
  var docs = $("pp-docs"); if (!docs) return;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var nl = function (s) { return esc(s).replace(/\n/g, "<br>"); };
  var n2 = function (x) { return Number(x).toLocaleString("en-KE", { maximumFractionDigits: 2 }); };
  var money = function (x) { return "KES " + Math.round(x).toLocaleString("en-KE"); };
  var fdate = function (d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
  var TYPES = {
    pv: ["Solar PV system", ["Site survey, load assessment and shading check", "System design and equipment selection", "Supply of PV modules, inverter, mounting structure, cabling and protection devices", "Installation, earthing and surge protection", "Testing, commissioning and performance check", "Handover, user training and basic documentation"]],
    water: ["Solar water heater / heat pump", ["Site survey and hot-water demand assessment", "Supply of heater or heat pump, storage tank and fittings", "Installation of collectors, plumbing and electrical connections", "Testing, commissioning and user guidance"]],
    borehole: ["Borehole solar pumping system", ["Review of borehole data and water demand", "Pump, controller and PV array selection", "Supply and installation of the pumping system and protection", "Testing, commissioning and handover"]],
    lighting: ["Solar street lighting", ["Lighting layout review and pole positions", "Supply of solar lights, poles and foundations as specified", "Installation, alignment and commissioning", "Handover and maintenance guidance"]],
    electrical: ["Electrical works", ["Site inspection and scope confirmation", "Supply of materials as listed", "Installation, testing and certification where required", "Handover and safety guidance"]],
    cctv: ["CCTV installation", ["Site survey and camera placement plan", "Supply of cameras, recorder, storage and cabling", "Installation, configuration and remote-viewing setup", "Testing and user training"]],
    fence: ["Electric fence installation", ["Site survey and perimeter measurement", "Supply of energiser, wires, insulators and warning signs", "Installation, earthing and testing", "Handover and safety guidance"]],
    maint: ["Maintenance contract", ["Initial inspection and condition report", "Scheduled preventive maintenance visits", "Fault finding and corrective works as agreed", "Service reports after each visit"]]
  };
  var DEF = { "pp-type": "pv", "pp-sys": "hybrid", "pp-vat": 0, "pp-valid": 30, "pp-pay": "50% deposit on acceptance, 40% on delivery of equipment to site and 10% on commissioning and handover.", "pp-deliv": "Typically 2 to 4 weeks from the deposit, depending on equipment availability and site readiness.", "pp-warr": "Equipment carries the manufacturer's warranty. Installation workmanship is warranted for [12] months from commissioning.", "pp-excl": "Structural or roof repairs, civil and building works, utility (KPLC) application and connection fees unless listed, and changes requested after approval.", "pp-by": "Harmonix Energy Solutions", "pp-date": new Date().toISOString().slice(0, 10), "pp-num": "HX-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-001" };
  var FIELDS = ["pp-cname", "pp-corg", "pp-cphone", "pp-cemail", "pp-csite", "pp-title", "pp-type", "pp-notes", "pp-sys", "pp-kwp", "pp-panels", "pp-pw", "pp-inv", "pp-batt", "pp-vat", "pp-valid", "pp-pay", "pp-deliv", "pp-warr", "pp-excl", "pp-by", "pp-num", "pp-date"];
  var saved = window.hxStore.get("proposal", {}), lines = saved.lines || [], mode = "sample";
  FIELDS.forEach(function (id) { var v = saved[id] != null ? saved[id] : DEF[id]; if (v != null) $(id).value = v; $(id).addEventListener("input", function () { persist(); render(); }); });
  function persist() { var o = { lines: lines }; FIELDS.forEach(function (id) { o[id] = $(id).value; }); window.hxStore.set("proposal", o); }
  var unlocked = !P.gate || window.hxStore.get("unlocked", false);

  /* line items */
  function drawLines() {
    $("pp-lines").innerHTML = lines.length ? lines.map(function (l, i) {
      return '<tr data-i="' + i + '"><td data-l="Item"><input class="field" style="min-width:9rem;width:100%" value="' + esc(l.d) + '" data-k="d" aria-label="Item description"></td><td data-l="Qty"><input type="number" min="0" step="any" value="' + l.q + '" data-k="q" aria-label="Quantity"></td><td data-l="Unit price"><input type="number" min="0" step="any" value="' + (l.p || "") + '" data-k="p" aria-label="Unit price in KES" placeholder="KES"></td><td data-l=""><button type="button" class="link" data-rm aria-label="Remove item" title="Remove">&times;</button></td></tr>';
    }).join("") : '<tr><td colspan="4" class="hint" style="padding:1rem;text-align:center">No items yet. Add equipment and labour lines, or build them from your design.</td></tr>';
  }
  $("pp-lines").addEventListener("input", function (e) { var tr = e.target.closest("tr[data-i]"); if (!tr || !e.target.dataset.k) return; var l = lines[+tr.dataset.i], k = e.target.dataset.k; l[k] = k === "d" ? e.target.value : parseFloat(e.target.value) || 0; persist(); render(); });
  $("pp-lines").addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; lines.splice(+b.closest("tr").dataset.i, 1); persist(); drawLines(); render(); });
  $("pp-addline").addEventListener("click", function () { lines.push({ d: "", q: 1, p: 0 }); persist(); drawLines(); render(); });
  $("pp-fromdesign").addEventListener("click", function () {
    var k = parseFloat($("pp-kwp").value) || 0, n = parseInt($("pp-panels").value) || 0, w = $("pp-pw").value, inv = $("pp-inv").value, b = parseFloat($("pp-batt").value) || 0, add = [];
    if (n) add.push({ d: "Solar PV modules, " + w + " W", q: n, p: 0 });
    if (inv) add.push({ d: "Inverter, " + inv + " kW", q: 1, p: 0 });
    if (b) add.push({ d: "Battery storage, " + b + " kWh", q: 1, p: 0 });
    if (n) add.push({ d: "Mounting structure, DC and AC cabling, protection and earthing", q: 1, p: 0 });
    add.push({ d: "Installation, testing and commissioning", q: 1, p: 0 });
    lines = lines.concat(add); persist(); drawLines(); render();
  });
  $("pp-import").addEventListener("click", function () {
    var d = window.hxStore.get("design", null), s = $("pp-import-msg");
    if (!d) { s.textContent = "Nothing saved yet. Use a calculator and press \"Use in a proposal\" first."; return; }
    $("pp-kwp").value = (Math.round(d.pvKwp * 100) / 100); $("pp-panels").value = d.panels; $("pp-pw").value = d.panelW; $("pp-inv").value = d.inverterKw; $("pp-batt").value = d.batteryKwh || 0;
    if (d.systemType) $("pp-sys").value = d.systemType === "grid" ? "grid" : d.systemType === "off" ? "off" : "hybrid";
    s.textContent = "Imported your latest calculator design."; persist(); render();
  });

  function totals() { var sub = 0; lines.forEach(function (l) { sub += (l.q || 0) * (l.p || 0); }); var vr = parseFloat($("pp-vat").value) || 0, vat = sub * vr / 100; return { sub: sub, vr: vr, vat: vat, total: sub + vat }; }
  function head(d, label) {
    var vd = new Date(d.date); vd.setDate(vd.getDate() + d.valid);
    return '<div class="doc-head"><div><span class="brand"><span class="brand-mark"><svg class="i"><use href="#i-bolt"/></svg></span><span>HARMONIX<small>ENERGY SOLUTIONS</small></span></span></div><div class="doc-meta"><strong>' + esc(label) + '</strong><br>No. ' + esc(d.num) + '<br>Date: ' + fdate(d.date) + '<br>Valid until: ' + fdate(vd) + '</div></div>';
  }
  function foot() { return '<p style="margin-top:1.4rem;font-size:.72rem;color:#586A82;border-top:1px solid #DDE6F0;padding-top:.6rem">' + esc(H.company) + ' &middot; ' + esc(H.phoneDisplay) + ' &middot; ' + esc(H.email) + ' &middot; ' + esc(H.location) + '</p>'; }
  function data() {
    var g = function (id) { return $(id).value.trim(); }, dt = new Date($("pp-date").value || Date.now());
    var t = TYPES[g("pp-type")] || TYPES.pv;
    return { cname: g("pp-cname") || "[Client name]", corg: g("pp-corg"), cphone: g("pp-cphone"), cemail: g("pp-cemail"), csite: g("pp-csite") || "[Project site]", title: g("pp-title") || t[0], type: t, notes: g("pp-notes"), sys: $("pp-sys").value, kwp: parseFloat(g("pp-kwp")) || 0, panels: parseInt(g("pp-panels")) || 0, pw: g("pp-pw"), inv: g("pp-inv"), batt: parseFloat(g("pp-batt")) || 0, valid: parseInt(g("pp-valid")) || 30, pay: g("pp-pay"), deliv: g("pp-deliv"), warr: g("pp-warr"), excl: g("pp-excl"), by: g("pp-by") || H.company, num: g("pp-num") || "HX-001", date: dt };
  }
  function summary(d) {
    var sysName = { grid: "grid-tied", hybrid: "hybrid (grid plus battery)", off: "off-grid" }[d.sys];
    var s = H.company + " is pleased to submit this proposal to " + esc(d.cname) + (d.corg ? " (" + esc(d.corg) + ")" : "") + " for the " + esc(d.title.charAt(0).toLowerCase() + d.title.slice(1)) + " at " + esc(d.csite) + ".";
    if (d.type === TYPES.pv && d.kwp) s += " The proposed solution is a " + sysName + " solar system of " + n2(d.kwp) + " kWp" + (d.panels ? " (" + d.panels + " x " + esc(d.pw) + " W modules)" : "") + (d.inv ? ", a " + esc(d.inv) + " kW inverter" : "") + (d.batt ? " and " + n2(d.batt) + " kWh of battery storage" : "") + ", sized to your energy needs and designed for reliable, safe operation.";
    else s += " The scope below has been prepared from the information you shared and will be confirmed at a site survey.";
    return s;
  }
  function sysTable(d) {
    if (!(d.kwp || d.panels || d.inv || d.batt)) return "";
    var r = [["System type", { grid: "Grid-tied", hybrid: "Hybrid", off: "Off-grid" }[d.sys]], d.kwp ? ["PV array size", n2(d.kwp) + " kWp"] : null, d.panels ? ["PV modules", d.panels + " x " + esc(d.pw) + " W"] : null, d.inv ? ["Inverter", esc(d.inv) + " kW"] : null, d.batt ? ["Battery storage", n2(d.batt) + " kWh"] : null].filter(Boolean);
    return '<table><tbody>' + r.map(function (x) { return '<tr><td style="width:40%;color:#586A82">' + x[0] + '</td><td><strong>' + x[1] + '</strong></td></tr>'; }).join("") + '</tbody></table>';
  }
  function boq(d, limit) {
    var T = totals(), L = limit ? lines.slice(0, limit) : lines;
    if (!lines.length) return '<p style="color:#586A82">[Add equipment and labour lines in the form to build the bill of quantities.]</p>';
    return '<table><thead><tr><th>#</th><th>Description</th><th class="num">Qty</th><th class="num">Unit (KES)</th><th class="num">Amount (KES)</th></tr></thead><tbody>' + L.map(function (l, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(l.d || "Item") + '</td><td class="num">' + n2(l.q) + '</td><td class="num">' + (l.p ? n2(l.p) : "-") + '</td><td class="num">' + (l.p ? n2(l.q * l.p) : "-") + '</td></tr>'; }).join("") + (limit && lines.length > limit ? '<tr><td></td><td colspan="4" style="color:#586A82">+ ' + (lines.length - limit) + ' more line(s) in the full proposal</td></tr>' : "") + '</tbody><tfoot><tr><td colspan="4" class="num">Subtotal</td><td class="num">' + n2(T.sub) + '</td></tr>' + (T.vr ? '<tr><td colspan="4" class="num">VAT (' + T.vr + '%)</td><td class="num">' + n2(T.vat) + '</td></tr>' : "") + '<tr><td colspan="4" class="num">Total (KES)</td><td class="num">' + n2(T.total) + '</td></tr></tfoot></table>';
  }
  function build() {
    var d = data(), wm = mode === "sample" ? "SAMPLE" : unlocked ? "" : "PREVIEW", w = wm ? ' data-wm="' + wm + '"' : "", out = "";
    if (mode === "sample") {
      out = '<article class="doc"' + w + '>' + head(d, "Proposal (sample)") + '<h1>' + esc(d.title) + '</h1><p style="color:#586A82">Prepared for <strong>' + esc(d.cname) + '</strong>' + (d.corg ? ", " + esc(d.corg) : "") + ' &middot; ' + esc(d.csite) + '</p><h2>Summary</h2><p>' + summary(d) + '</p>' + (sysTable(d) ? '<h2>System overview</h2>' + sysTable(d) : "") + '<h2>Investment</h2>' + boq(d, 5) + '<p style="margin-top:.8rem"><em>This one-page sample shows the layout. The full proposal adds the scope of work, complete bill of quantities, payment terms, warranty and an acceptance page.</em></p>' + foot() + '</article>';
    } else {
      var scope = '<ul>' + d.type[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join("") + '</ul>';
      out = '<article class="doc"' + w + '>' + head(d, "Proposal") + '<h1>' + esc(d.title) + '</h1><p style="color:#586A82">Prepared for <strong>' + esc(d.cname) + '</strong>' + (d.corg ? ", " + esc(d.corg) : "") + '<br>' + esc(d.csite) + (d.cphone ? " &middot; " + esc(d.cphone) : "") + (d.cemail ? " &middot; " + esc(d.cemail) : "") + '<br>Prepared by ' + esc(d.by) + '</p><h2>1. Executive summary</h2><p>' + summary(d) + '</p>' + (sysTable(d) ? '<h2>2. Proposed system</h2>' + sysTable(d) : '') + '<h2>3. Scope of work</h2>' + scope + (d.notes ? '<p><strong>Additional notes:</strong><br>' + nl(d.notes) + '</p>' : "") + foot() + '</article>' +
        '<article class="doc"' + w + '>' + head(d, "Proposal") + '<h2>4. Bill of quantities and investment</h2>' + boq(d) + '<h2>5. Delivery and timeline</h2><p>' + nl(d.deliv) + '</p><p class="hint" style="color:#586A82">System sizing is based on the information supplied and will be confirmed after a site survey.</p>' + foot() + '</article>' +
        '<article class="doc"' + w + '>' + head(d, "Proposal") + '<h2>6. Commercial terms</h2><p><strong>Validity:</strong> this proposal is valid for ' + d.valid + ' days from the date above.</p><p><strong>Payment:</strong> ' + nl(d.pay) + '</p><p><strong>Warranty:</strong> ' + nl(d.warr) + '</p><p><strong>Exclusions:</strong> ' + nl(d.excl) + '</p><h2>7. Acceptance</h2><p>To accept, sign below and return a copy with the deposit. We will then schedule the site survey and delivery.</p><div class="sign"><div>For ' + esc(H.company) + '<br>Name / Signature / Date</div><div>For ' + esc(d.cname) + '<br>Name / Signature / Date</div></div>' + foot() + '</article>';
    }
    return out;
  }
  function render() {
    docs.innerHTML = build();
    var gated = mode === "full" && !unlocked;
    $("pp-lock").classList.toggle("hidden", !gated); $("pp-print").disabled = gated; $("pp-print").style.opacity = gated ? .5 : 1;
    document.querySelectorAll("[data-pm]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.pm === mode); });
  }
  document.querySelectorAll("[data-pm]").forEach(function (b) { b.addEventListener("click", function () { mode = b.dataset.pm; render(); }); });
  $("pp-print").addEventListener("click", function () { window.print(); });
  $("pp-wa").addEventListener("click", function () {
    var d = data(), T = totals(); window.openWA(["Hello Harmonix Energy, I would like a quotation.", "Client: " + d.cname + (d.corg ? " (" + d.corg + ")" : ""), "Phone: " + d.cphone, "Site: " + d.csite, "Project: " + d.title, d.kwp ? "Design: " + n2(d.kwp) + " kWp, " + d.panels + " x " + d.pw + " W, inverter " + d.inv + " kW, battery " + d.batt + " kWh" : "", T.total ? "Budget lines total: " + money(T.total) : ""].filter(Boolean).join("\n"));
  });
  $("pp-reqcode").addEventListener("click", function () { window.openWA("Hello Harmonix Energy, I would like to buy a full proposal (KES " + P.priceKES + "). Please send the payment details and my unlock code."); });
  $("pp-paynote").textContent = P.paymentNote;
  $("pp-unlock").addEventListener("click", function () {
    var m = $("pp-unlock-msg"), c = $("pp-code").value; if (!c.trim()) { m.textContent = "Enter your unlock code."; return; }
    window.hxHash(c).then(function (h) { if (P.unlockHashes.indexOf(h) > -1) { unlocked = true; window.hxStore.set("unlocked", true); m.textContent = ""; render(); } else m.textContent = "That code was not recognised. Check it or request a new one on WhatsApp."; });
  });
  $("pp-reset").addEventListener("click", function () { if (!confirm("Clear the form and start again?")) return; window.hxStore.set("proposal", {}); location.reload(); });
  drawLines(); render();
})();
