/* Product catalogue: edit the PRODUCTS list below. Leave price as null to show "Request price". */
(function () {
  "use strict";
  var H = window.HX, $ = function (id) { return document.getElementById(id); };
  var CATS = [["all", "All products"], ["panels", "Solar panels"], ["inverters", "Inverters"], ["batteries", "Batteries"], ["controllers", "Charge controllers"], ["mounting", "Mounting structures"], ["accessories", "Electrical accessories"]];
  var PRODUCTS = [
    { id: "pv-mono", cat: "panels", name: "Monocrystalline PV Modules", desc: "High-efficiency modules in a range of wattages for homes, businesses and industry.", tags: ["Residential", "Commercial"], price: null, img: "" },
    { id: "pv-bifacial", cat: "panels", name: "Bifacial and N-type Modules", desc: "Higher-output modules for larger rooftops and ground-mounted arrays.", tags: ["Commercial", "Industrial"], price: null, img: "" },
    { id: "inv-hybrid", cat: "inverters", name: "Hybrid Inverters", desc: "Single-phase and three-phase inverters that combine solar, battery and grid supply.", tags: ["Backup power", "Monitoring"], price: null, img: "" },
    { id: "inv-grid", cat: "inverters", name: "Grid-tied String Inverters", desc: "For solar-only systems that feed your building and cut your electricity bill.", tags: ["Residential", "Commercial"], price: null, img: "" },
    { id: "inv-off", cat: "inverters", name: "Off-grid Inverter Chargers", desc: "Reliable power for sites without a grid connection or with unstable supply.", tags: ["Off-grid", "Remote sites"], price: null, img: "" },
    { id: "bat-lfp", cat: "batteries", name: "Lithium (LiFePO4) Batteries", desc: "Long-life storage for homes and businesses, with built-in battery management.", tags: ["Long life", "Low maintenance"], price: null, img: "" },
    { id: "bat-lead", cat: "batteries", name: "Deep-cycle Lead-acid and Gel Batteries", desc: "Budget-friendly storage for lighter daily use and smaller systems.", tags: ["Budget option"], price: null, img: "" },
    { id: "ctl-mppt", cat: "controllers", name: "MPPT Charge Controllers", desc: "Charge controllers that get more energy from your panels in off-grid and battery systems.", tags: ["Off-grid", "Battery systems"], price: null, img: "" },
    { id: "mnt-roof", cat: "mounting", name: "Roof Mounting Kits", desc: "Rails, brackets and fixings for tile, iron-sheet and flat roofs.", tags: ["Tile", "IBR", "Flat roof"], price: null, img: "" },
    { id: "mnt-ground", cat: "mounting", name: "Ground-mount Structures", desc: "Galvanised structures for larger arrays on open ground or carports.", tags: ["Commercial", "Industrial"], price: null, img: "" },
    { id: "acc-protect", cat: "accessories", name: "Breakers, Isolators and Surge Protection", desc: "DC and AC protection devices that keep your system and your people safe.", tags: ["Safety"], price: null, img: "" },
    { id: "acc-cable", cat: "accessories", name: "Solar Cables and MC4 Connectors", desc: "UV-resistant solar cable, connectors and cable management in common sizes.", tags: ["UV resistant"], price: null, img: "" },
    { id: "acc-db", cat: "accessories", name: "Distribution Boards and Earthing", desc: "Combiner boxes, distribution boards and earthing materials for a compliant install.", tags: ["Compliance"], price: null, img: "" }
  ];
  var ART = {
    panels: '<path d="M18 62 30 24h74l-8 38z" fill="#1D4F91" fill-opacity=".15"/><path d="M18 62 30 24h74l-8 38zM24 43h72M46 24l-8 38M72 24l-4 38" /><circle cx="104" cy="16" r="6" fill="#F6B01E" stroke="none"/>',
    inverters: '<rect x="30" y="14" width="60" height="62" rx="8" fill="#1D4F91" fill-opacity=".12"/><rect x="40" y="24" width="40" height="16" rx="3"/><path d="M62 48 54 62h8l-2 10 10-16h-8z" fill="#F6B01E" stroke="none"/>',
    batteries: '<rect x="22" y="30" width="70" height="38" rx="6" fill="#1D4F91" fill-opacity=".12"/><path d="M92 42h6v14h-6"/><path d="M32 40v18M44 40v18M56 40v18" stroke="#F6B01E" stroke-width="5"/>',
    controllers: '<rect x="28" y="18" width="64" height="54" rx="7" fill="#1D4F91" fill-opacity=".12"/><rect x="38" y="28" width="30" height="14" rx="2"/><circle cx="78" cy="35" r="5"/><path d="M38 56h44M38 64h26" stroke="#F6B01E" stroke-width="4"/>',
    mounting: '<path d="M14 70h92M24 70 40 38M58 70 74 38M92 70 100 52"/><path d="M30 34h56l-8 12H22z" fill="#1D4F91" fill-opacity=".15"/><path d="M40 38 52 34" stroke="#F6B01E" stroke-width="4"/>',
    accessories: '<rect x="24" y="20" width="22" height="50" rx="4" fill="#1D4F91" fill-opacity=".12"/><rect x="52" y="20" width="22" height="50" rx="4" fill="#1D4F91" fill-opacity=".12"/><rect x="80" y="20" width="22" height="50" rx="4" fill="#1D4F91" fill-opacity=".12"/><path d="M35 30v14M63 44v14M91 30v14" stroke="#F6B01E" stroke-width="5"/>'
  };
  var art = function (c) { return '<svg viewBox="0 0 120 90" width="100%" height="100%" fill="none" stroke="#1D4F91" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" style="max-height:9rem;padding:.8rem">' + ART[c] + '</svg>'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var cat = "all", basket = window.hxStore.get("basket", []);
  var grid = $("pr-grid"); if (!grid) return;
  var hashCat = location.hash.slice(1); if (CATS.some(function (c) { return c[0] === hashCat; })) cat = hashCat;

  function filters() {
    $("pr-filters").innerHTML = CATS.map(function (c) { var n = c[0] === "all" ? PRODUCTS.length : PRODUCTS.filter(function (p) { return p.cat === c[0]; }).length; return '<button type="button" class="filter-btn" data-c="' + c[0] + '" aria-pressed="' + (c[0] === cat) + '">' + c[1] + '<span>' + n + '</span></button>'; }).join("");
  }
  function list() {
    var q = ($("pr-search").value || "").toLowerCase().trim(), sort = $("pr-sort").value;
    var L = PRODUCTS.filter(function (p) { return (cat === "all" || p.cat === cat) && (!q || (p.name + " " + p.desc + " " + p.tags.join(" ")).toLowerCase().indexOf(q) > -1); });
    if (sort === "az") L.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (sort === "price") L.sort(function (a, b) { return (a.price == null) - (b.price == null) || a.price - b.price; });
    $("pr-count").textContent = L.length + (L.length === 1 ? " product" : " products");
    grid.innerHTML = L.length ? L.map(function (p) {
      var inB = basket.indexOf(p.id) > -1;
      return '<article class="card product reveal in"><div class="product-img">' + (p.img ? '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' : art(p.cat)) + '</div><span class="tag">' + esc(CATS.filter(function (c) { return c[0] === p.cat; })[0][1]) + '</span><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p><div class="meta">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join("") + '</div><div class="' + (p.price == null ? "price ask" : "price") + '">' + (p.price == null ? "Request current price" : window.fmtKES(p.price)) + '</div><div class="actions"><button type="button" class="btn btn-sm ' + (inB ? "btn-green" : "") + '" data-add="' + p.id + '">' + (inB ? "Added to enquiry" : "Add to enquiry") + '</button></div></article>';
    }).join("") : '<div class="empty" style="grid-column:1/-1">No products match your search. <a class="link" href="#" data-wa="Hello Harmonix Energy, I am looking for a specific product.">Ask us on WhatsApp</a> and we will source it for you.</div>';
    document.querySelectorAll("#pr-grid [data-wa]").forEach(function (el) { el.href = window.waLink(el.dataset.wa); });
  }
  function bar() {
    $("basket-btn").classList.toggle("hidden", !basket.length); $("basket-n").textContent = basket.length;
    $("drawer-list").innerHTML = basket.length ? basket.map(function (id) { var p = PRODUCTS.filter(function (x) { return x.id === id; })[0]; return p ? '<li><span>' + esc(p.name) + '</span><button type="button" class="link" data-rm="' + id + '" aria-label="Remove ' + esc(p.name) + '">Remove</button></li>' : ""; }).join("") : '<li>Your enquiry list is empty.</li>';
  }
  var save = function () { window.hxStore.set("basket", basket); };
  $("pr-filters").addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (!b) return; cat = b.dataset.c; history.replaceState(null, "", cat === "all" ? location.pathname : "#" + cat); filters(); list(); });
  $("pr-search").addEventListener("input", list); $("pr-sort").addEventListener("change", list);
  grid.addEventListener("click", function (e) { var b = e.target.closest("[data-add]"); if (!b) return; var i = basket.indexOf(b.dataset.add); i > -1 ? basket.splice(i, 1) : basket.push(b.dataset.add); save(); list(); bar(); });
  var dr = $("drawer"), open = function (o) { dr.classList.toggle("open", o); if (o) $("drawer-close").focus(); };
  $("basket-btn").addEventListener("click", function () { open(true); }); $("drawer-close").addEventListener("click", function () { open(false); }); dr.querySelector(".drawer-bg").addEventListener("click", function () { open(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") open(false); });
  $("drawer-list").addEventListener("click", function (e) { var b = e.target.closest("[data-rm]"); if (!b) return; basket.splice(basket.indexOf(b.dataset.rm), 1); save(); list(); bar(); });
  function names() { return basket.map(function (id) { var p = PRODUCTS.filter(function (x) { return x.id === id; })[0]; return "- " + (p ? p.name : id); }).join("\n"); }
  $("drawer-wa").addEventListener("click", function () { if (basket.length) window.openWA("Hello Harmonix Energy, I would like a quotation for:\n" + names() + "\n\nMy name:\nLocation:\nProject type:"); });
  $("drawer-mail").addEventListener("click", function () { if (basket.length) location.href = "mailto:" + H.email + "?subject=" + encodeURIComponent("Product enquiry") + "&body=" + encodeURIComponent("Hello Harmonix Energy,\n\nI would like a quotation for:\n" + names() + "\n\nName:\nPhone:\nLocation:"); });
  $("drawer-clear").addEventListener("click", function () { basket = []; save(); list(); bar(); });
  filters(); list(); bar();
})();
