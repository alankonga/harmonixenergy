/* Calculators: appliance load + system sizing, and solar savings estimator. All maths runs in the browser. */
(function () {
  "use strict";
  var H = window.HX, $ = function (id) { return document.getElementById(id); };
  var SIZES = [1, 1.5, 2, 3, 3.6, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200];
  var nextSize = function (kw) { for (var i = 0; i < SIZES.length; i++) if (SIZES[i] >= kw) return SIZES[i]; return Math.ceil(kw / 10) * 10; };
  var halfUp = function (x) { return Math.ceil(x * 2) / 2; };
  var f1 = function (x) { return (Math.round(x * 10) / 10).toLocaleString("en-KE", { maximumFractionDigits: 1 }); };
  var f2 = function (x) { return (Math.round(x * 100) / 100).toLocaleString("en-KE", { maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var PR = 0.75, AREA550 = 2.6;
  var DOD = { lfp: 0.9, lead: 0.5 };
  function copy(text, btn) {
    var done = function () { if (btn) { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1500); } };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  }
  function printTool(el) {
    document.querySelectorAll(".tool").forEach(function (t) { t.classList.remove("print-area"); });
    el.classList.add("print-area"); window.print();
  }

  /* ---------- 1. Appliance load calculator ---------- */
  var lcEl = $("lc-body");
  if (lcEl) {
    var PRESETS = [["LED bulb", 10, 2, 5, 0], ["Fridge", 150, 6, 6, 1], ["Freezer", 200, 6, 6, 1], ["TV", 100, 3, 4, 0], ["Laptop", 60, 4, 2, 0], ["Phone charger", 10, 1, 2, 0], ["Wi-Fi router", 12, 12, 12, 0], ["Ceiling fan", 70, 5, 5, 0], ["Microwave", 1000, 0.3, 0.2, 0], ["Electric kettle", 1500, 0.3, 0.2, 0], ["Iron box", 1000, 0.5, 0, 0], ["Washing machine", 500, 1, 0, 1], ["Water pump", 750, 1, 0.5, 1], ["Security light", 20, 0, 12, 0], ["Desktop computer", 150, 6, 0, 0], ["Printer", 30, 0.5, 0, 0]];
    var S = window.hxStore.get("load", null) || { items: [], s: { sun: H.sunHours, panel: H.panelWatts, batt: "lfp", volt: 48, auto: "night", margin: 20, div: 0.8 } };
    var items = S.items, st = S.s, last = null;
    var save = function () { window.hxStore.set("load", { items: items, s: st }); };
    $("lc-presets").innerHTML = PRESETS.map(function (p, i) { return '<button type="button" class="chip" data-p="' + i + '">+ ' + p[0] + '</button>'; }).join("");
    ["sun", "panel", "batt", "volt", "auto", "margin", "div"].forEach(function (k) { var el = $("lc-" + k); el.value = st[k]; el.addEventListener("input", function () { st[k] = el.tagName === "SELECT" && isNaN(el.value) ? el.value : parseFloat(el.value); save(); calc(); }); });

    var add = function (name, w, qty, d, n, motor) {
      var ex = items.filter(function (i) { return i.name.toLowerCase() === name.toLowerCase() && i.w === w; })[0];
      if (ex) ex.qty += qty; else items.push({ name: name, w: w, qty: qty, day: d, night: n, motor: !!motor });
      save(); draw(); calc();
    };
    $("lc-presets").addEventListener("click", function (e) { var b = e.target.closest("[data-p]"); if (!b) return; var p = PRESETS[+b.dataset.p]; add(p[0], p[1], 1, p[2], p[3], p[4]); });
    $("lc-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var n = $("lc-name").value.trim(), w = parseFloat($("lc-w").value);
      if (!n || !(w > 0)) return;
      add(n, w, Math.max(1, parseInt($("lc-qty").value) || 1), Math.min(24, Math.max(0, parseFloat($("lc-day").value) || 0)), Math.min(24, Math.max(0, parseFloat($("lc-night").value) || 0)), $("lc-motor").checked);
      e.target.reset(); $("lc-qty").value = 1; $("lc-day").value = 2; $("lc-night").value = 2; $("lc-name").focus();
    });
    function draw() {
      if (!items.length) { lcEl.innerHTML = '<tr><td colspan="7" class="hint" style="padding:1.2rem;text-align:center">No appliances yet. Tap a quick-add button above or enter your own.</td></tr>'; return; }
      lcEl.innerHTML = items.map(function (a, i) {
        return '<tr data-i="' + i + '"><td data-l="Appliance"><strong>' + esc(a.name) + '</strong>' + (a.motor ? ' <span class="tag">motor</span>' : '') + '</td><td data-l="Watts">' + a.w + ' W</td>' +
          '<td data-l="Qty"><input type="number" min="1" value="' + a.qty + '" data-k="qty" aria-label="Quantity of ' + esc(a.name) + '"></td>' +
          '<td data-l="Day hours"><input type="number" min="0" max="24" step="0.5" value="' + a.day + '" data-k="day" aria-label="Day hours for ' + esc(a.name) + '"></td>' +
          '<td data-l="Night hours"><input type="number" min="0" max="24" step="0.5" value="' + a.night + '" data-k="night" aria-label="Night hours for ' + esc(a.name) + '"></td>' +
          '<td class="num" data-l="Wh per day" data-wh>' + Math.round(a.w * a.qty * (a.day + a.night)).toLocaleString() + '</td>' +
          '<td data-l=""><button type="button" class="link" data-rm aria-label="Remove ' + esc(a.name) + '">Remove</button></td></tr>';
      }).join("");
    }
    lcEl.addEventListener("input", function (e) {
      var tr = e.target.closest("tr[data-i]"); if (!tr) return; var a = items[+tr.dataset.i], k = e.target.dataset.k; if (!k) return;
      var v = parseFloat(e.target.value); a[k] = k === "qty" ? Math.max(1, Math.floor(v) || 1) : Math.min(24, Math.max(0, v || 0));
      tr.querySelector("[data-wh]").textContent = Math.round(a.w * a.qty * (a.day + a.night)).toLocaleString(); save(); calc();
    });
    lcEl.addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; items.splice(+b.closest("tr").dataset.i, 1); save(); draw(); calc(); });
    $("lc-clear").addEventListener("click", function () { if (items.length && !confirm("Remove all appliances?")) return; items.length = 0; save(); draw(); calc(); });

    function calc() {
      var out = $("lc-out");
      if (!items.length) { last = null; out.innerHTML = '<div class="out-empty"><strong>Your results will appear here</strong><br>Add the appliances you want to power and we will size the solar array, battery and inverter for you.</div>'; toggleBtns(true); return; }
      var day = 0, night = 0, conn = 0, extra = 0;
      items.forEach(function (a) { var w = a.w * a.qty; day += w * a.day; night += w * a.night; conn += w; if (a.motor) extra = Math.max(extra, w * 2); });
      var dayK = day / 1000, nightK = night / 1000, tot = dayK + nightK, mg = 1 + st.margin / 100;
      var peak = conn * st.div, invMin = Math.max(peak * 1.25, peak + extra) / 1000, inv = nextSize(invMin);
      var pvKw = tot * mg / (st.sun * PR), panels = Math.max(1, Math.ceil(pvKw * 1000 / st.panel)), arr = panels * st.panel / 1000, area = panels * st.panel / 550 * AREA550;
      var usable = (st.auto === "night" ? nightK : st.auto === "buffer" ? nightK + 0.25 * dayK : tot) * mg;
      var nominal = halfUp(usable / DOD[st.batt] / 0.95), ah = nominal * 1000 / st.volt;
      var mppt = Math.ceil(arr * 1000 / st.volt * 1.25);
      var mx = Math.max(dayK, nightK, 0.001);
      var top = items.map(function (a) { return { n: a.name, wh: a.w * a.qty * (a.day + a.night) }; }).sort(function (x, y) { return y.wh - x.wh; }).slice(0, 3);
      last = { kind: "load", dailyKwh: tot, peakKw: peak / 1000, pvKwp: arr, panels: panels, panelW: st.panel, inverterKw: inv, batteryKwh: nominal, batteryV: st.volt, systemType: st.auto === "night" && !nominal ? "grid-tied" : "hybrid", date: new Date().toISOString() };
      var summary = ["Load calculator summary (Harmonix Energy)", "Daily energy: " + f1(tot) + " kWh (day " + f1(dayK) + ", night " + f1(nightK) + ")", "Peak load: " + f1(peak / 1000) + " kW; inverter about " + inv + " kW", "Solar array: " + f1(arr) + " kWp = " + panels + " x " + st.panel + " W panels (about " + Math.round(area) + " m2)", "Battery: about " + nominal + " kWh at " + st.volt + " V (" + Math.round(ah) + " Ah, " + (st.batt === "lfp" ? "lithium" : "lead-acid") + ")", "Charge controller: about " + mppt + " A MPPT (if not built into the inverter)", "Appliances: " + items.map(function (a) { return a.qty + " x " + a.name + " " + a.w + "W"; }).join(", ")].join("\n");
      last.summary = summary;
      out.innerHTML = '<div class="kpis"><div class="kpi hl"><small>Solar array</small><strong>' + f1(arr) + ' kWp</strong></div><div class="kpi"><small>Panels (' + st.panel + ' W)</small><strong>' + panels + '</strong></div><div class="kpi"><small>Battery (nominal)</small><strong>' + nominal + ' kWh</strong></div><div class="kpi"><small>Inverter</small><strong>' + inv + ' kW</strong></div></div>' +
        '<h3 style="font-size:1rem">Energy use per day</h3><div class="bars"><div class="bar"><span>Daytime</span><div class="bar-track"><i style="width:' + (dayK / mx * 100) + '%"></i></div><b>' + f2(dayK) + ' kWh</b></div><div class="bar"><span>Night</span><div class="bar-track"><i class="n" style="width:' + (nightK / mx * 100) + '%"></i></div><b>' + f2(nightK) + ' kWh</b></div></div>' +
        '<table class="mini"><tr><th>Item</th><th>Result</th></tr><tr><td>Total energy per day</td><td><strong>' + f1(tot) + ' kWh</strong> (+' + st.margin + '% margin = ' + f1(tot * mg) + ' kWh)</td></tr><tr><td>Peak load running together</td><td>' + f1(peak / 1000) + ' kW of ' + f1(conn / 1000) + ' kW connected</td></tr><tr><td>Array space needed</td><td>about ' + Math.round(area) + ' m&sup2;</td></tr><tr><td>Battery capacity</td><td>' + Math.round(ah) + ' Ah at ' + st.volt + ' V</td></tr><tr><td>MPPT charge controller</td><td>about ' + mppt + ' A at ' + st.volt + ' V</td></tr></table>' +
        '<p class="hint"><strong>Biggest users:</strong> ' + top.map(function (t) { return esc(t.n) + ' (' + Math.round(t.wh / (day + night) * 100) + '%)'; }).join(", ") + '. Reducing these cuts the system size the most.</p>';
      toggleBtns(false);
    }
    function toggleBtns(dis) { ["lc-save", "lc-wa", "lc-copy", "lc-print"].forEach(function (id) { $(id).disabled = dis; $(id).style.opacity = dis ? .5 : 1; }); }
    $("lc-save").addEventListener("click", function () { if (!last) return; window.hxStore.set("design", last); this.textContent = "Saved for your proposal"; var b = this; setTimeout(function () { b.textContent = "Use in a proposal"; }, 2000); });
    $("lc-wa").addEventListener("click", function () { if (last) window.openWA(last.summary + "\n\nPlease prepare a quotation for this."); });
    $("lc-copy").addEventListener("click", function () { if (last) copy(last.summary, this); });
    $("lc-print").addEventListener("click", function () { if (last) printTool($("tool-load")); });
    draw(); calc();
  }

  /* ---------- 2. Solar savings and sizing estimator ---------- */
  var seOut = $("se-out");
  if (seOut) {
    var mode = "bill", lastS = null;
    ["se-tariff", "se-sun", "se-panel"].forEach(function (id) { $(id).value = { "se-tariff": H.tariff, "se-sun": H.sunHours, "se-panel": H.panelWatts }[id]; });
    document.querySelectorAll("[data-mode]").forEach(function (b) { b.addEventListener("click", function () { mode = b.dataset.mode; document.querySelectorAll("[data-mode]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); $("se-bill-wrap").classList.toggle("hidden", mode !== "bill"); $("se-units-wrap").classList.toggle("hidden", mode !== "units"); est(); }); });
    var syncType = function () { var off = $("se-type").value === "grid"; $("se-backup-wrap").classList.toggle("hidden", off); $("se-batt-wrap").classList.toggle("hidden", off); };
    $("se-type").addEventListener("change", syncType); syncType();
    document.querySelectorAll("#tool-solar input, #tool-solar select").forEach(function (el) { el.addEventListener("input", est); el.addEventListener("change", est); });
    function est() {
      var tariff = parseFloat($("se-tariff").value) || 0, bill = parseFloat($("se-bill").value) || 0, units = parseFloat($("se-units").value) || 0;
      var monthly = mode === "bill" ? (tariff ? bill / tariff : 0) : units;
      var cover = Math.min(100, Math.max(10, parseFloat($("se-cover").value) || 80)) / 100, sun = parseFloat($("se-sun").value) || H.sunHours, pw = parseFloat($("se-panel").value) || H.panelWatts;
      var roof = parseFloat($("se-roof").value) || 0, cost = parseFloat($("se-cost").value) || 0, type = $("se-type").value;
      if (!(monthly > 0)) { seOut.innerHTML = '<div class="out-empty"><strong>Your estimate will appear here</strong><br>Enter your monthly electricity bill or units to see the system size, expected savings and payback.</div>'; lastS = null; ["se-wa", "se-copy", "se-print", "se-save"].forEach(function (id) { $(id).disabled = true; $(id).style.opacity = .5; }); return; }
      var size = function (c) { var daily = monthly / 30 * c, kwp = daily / (sun * PR), n = Math.max(1, Math.ceil(kwp * 1000 / pw)); var a = n * pw / 1000, gen = a * sun * 365 * PR / 12, sav = Math.min(gen, monthly) * tariff; return { c: c, kwp: a, n: n, gen: gen, sav: sav, daily: daily }; };
      var r = size(cover), area = r.n * pw / 550 * AREA550, inv = nextSize(r.kwp / 1.15), annual = r.sav * 12;
      var bk = parseFloat($("se-backup").value) || 0, batt = $("se-batt").value, avg = monthly / 30 / 24, nominal = type === "grid" ? 0 : halfUp(avg * bk / DOD[batt] / 0.95);
      var fit = roof ? (area <= roof ? "Fits in your " + roof + " m&sup2; roof space." : "Needs more than your " + roof + " m&sup2;. About " + Math.floor(roof / (pw / 550 * AREA550)) + " panels fit, so choose higher-watt panels or a lower coverage.") : "";
      var pay = cost && annual ? (cost / annual) : 0;
      lastS = { kind: "solar", dailyKwh: monthly / 30, pvKwp: r.kwp, panels: r.n, panelW: pw, inverterKw: inv, batteryKwh: nominal, batteryV: 48, systemType: type, date: new Date().toISOString() };
      lastS.summary = ["Solar estimate (Harmonix Energy)", "Usage: about " + f1(monthly) + " kWh/month" + (mode === "bill" ? " (from a KES " + bill.toLocaleString() + " bill at KES " + tariff + "/kWh)" : ""), "Target solar share: " + Math.round(cover * 100) + "%", "System: " + f1(r.kwp) + " kWp = " + r.n + " x " + pw + " W panels, inverter about " + inv + " kW" + (nominal ? ", battery about " + nominal + " kWh" : ""), "Expected solar output: about " + Math.round(r.gen) + " kWh/month", "Estimated saving: about KES " + Math.round(r.sav).toLocaleString() + "/month (KES " + Math.round(annual).toLocaleString() + "/year)" + (pay ? "; simple payback about " + f1(pay) + " years" : "")].join("\n");
      var rows = [0.5, 0.7, 0.9, 1].map(function (c) { var x = size(c); return '<tr' + (Math.abs(c - cover) < .01 ? ' style="font-weight:800"' : '') + '><td>' + Math.round(c * 100) + '%</td><td>' + f1(x.kwp) + ' kWp</td><td>' + x.n + '</td><td>KES ' + Math.round(x.sav).toLocaleString() + '</td></tr>'; }).join("");
      seOut.innerHTML = '<div class="kpis"><div class="kpi hl"><small>System size</small><strong>' + f1(r.kwp) + ' kWp</strong></div><div class="kpi"><small>Panels (' + pw + ' W)</small><strong>' + r.n + '</strong></div><div class="kpi"><small>Saving per month</small><strong>' + window.fmtKES(r.sav) + '</strong></div><div class="kpi"><small>Saving per year</small><strong>' + window.fmtKES(annual) + '</strong></div></div>' +
        '<table class="mini"><tr><td>Estimated usage</td><td><strong>' + f1(monthly) + ' kWh / month</strong></td></tr><tr><td>Solar output</td><td>about ' + Math.round(r.gen) + ' kWh / month</td></tr><tr><td>Inverter</td><td>about ' + inv + ' kW</td></tr>' + (nominal ? '<tr><td>Backup battery (' + bk + ' h)</td><td>about ' + nominal + ' kWh</td></tr>' : '') + '<tr><td>Roof space needed</td><td>about ' + Math.round(area) + ' m&sup2;</td></tr>' + (pay ? '<tr><td>Simple payback</td><td><strong>' + f1(pay) + ' years</strong></td></tr>' : '') + '</table>' + (fit ? '<p class="notice" style="margin-top:.5rem">' + fit + '</p>' : '') +
        '<h3 style="font-size:1rem;margin-top:1rem">Compare solar share</h3><table class="mini"><tr><th>Share</th><th>Size</th><th>Panels</th><th>Saving / month</th></tr>' + rows + '</table><p class="hint">Bills also include fixed charges and levies, so use the units (kWh) from your bill for the most accurate result.</p>';
      ["se-wa", "se-copy", "se-print", "se-save"].forEach(function (id) { $(id).disabled = false; $(id).style.opacity = 1; });
    }
    $("se-save").addEventListener("click", function () { if (!lastS) return; window.hxStore.set("design", lastS); var b = this; b.textContent = "Saved for your proposal"; setTimeout(function () { b.textContent = "Use in a proposal"; }, 2000); });
    $("se-wa").addEventListener("click", function () { if (lastS) window.openWA(lastS.summary + "\n\nPlease prepare a quotation for this."); });
    $("se-copy").addEventListener("click", function () { if (lastS) copy(lastS.summary, this); });
    $("se-print").addEventListener("click", function () { if (lastS) printTool($("tool-solar")); });
    est();
  }
})();
