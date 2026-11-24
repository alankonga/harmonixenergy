/* Shared behaviour: navigation, WhatsApp links, enquiry forms, reveal-on-scroll, hashing helper. */
(function () {
  "use strict";
  var H = window.HX;
  window.waLink = function (msg) { return "https://wa.me/" + H.phone + "?text=" + encodeURIComponent(msg); };
  window.openWA = function (msg) { window.open(window.waLink(msg), "_blank", "noopener"); };
  window.hxHash = function (s) {
    var b = new TextEncoder().encode(String(s).trim().toUpperCase());
    return crypto.subtle.digest("SHA-256", b).then(function (d) { return Array.from(new Uint8Array(d)).map(function (x) { return x.toString(16).padStart(2, "0"); }).join(""); });
  };
  window.fmtKES = function (n) { return "KES " + Math.round(n).toLocaleString("en-KE"); };
  window.hxStore = {
    get: function (k, d) { try { var v = localStorage.getItem("hx_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("hx_" + k, JSON.stringify(v)); } catch (e) {} }
  };

  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.setAttribute("href", window.waLink(el.dataset.wa)); el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener");
  });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  var btn = document.querySelector(".menu-toggle"), links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", function () { var o = links.classList.toggle("open"); btn.setAttribute("aria-expanded", o); });
    links.addEventListener("click", function (e) { if (e.target.closest("a")) { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
  }

  document.querySelectorAll(".enquiry-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form), g = function (k) { return (d.get(k) || "").toString().trim(); };
      var msg = ["Hello Harmonix Energy, I would like to make an enquiry.", "Name: " + g("name"), "Phone: " + g("phone")];
      if (g("email")) msg.push("Email: " + g("email"));
      if (g("town")) msg.push("Location: " + g("town"));
      msg.push("Interested in: " + g("service"));
      if (g("details")) msg.push("Details: " + g("details"));
      window.openWA(msg.join("\n"));
      var s = form.querySelector(".form-status"); if (s) s.textContent = "Opening WhatsApp. Press send there to reach us.";
    });
  });

  /* Scroll reveal: headings, text, cards and steps fade in as they come into view.
     Content is only hidden once this script runs, and it is always revealed again by scrolling, so it can never stay invisible. */
  var SEL = ".section-head > *, .hero-grid > div:first-child > :not(h1), .hero-media, .page-hero .container > :not(h1), .two-col > .photo, .two-col > div:last-child > *, .two-col > .contact-card, .card, .step, .faq, .cta, .contact-card, .tool-head, .trust li, .check-list li, .footer-grid > div, .notice";
  var els = [];
  document.querySelectorAll(SEL).forEach(function (el) {
    if (el.closest(".drawer, .doc-wrap, .tool-body, .filters, #pr-grid") || el.classList.contains("pre")) return;
    var sib = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty("--d", Math.min(sib, 6) * 90 + "ms");
    el.classList.add("reveal", "pre"); els.push(el);
  });
  function check() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    els = els.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) { el.classList.add("in"); return false; }
      return true;
    });
    if (!els.length) { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); }
  }
  var tick = false;
  function onScroll() { if (tick) return; tick = true; requestAnimationFrame(function () { tick = false; check(); }); }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("hashchange", onScroll);
  window.addEventListener("load", check);
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) x.target.classList.add("in"); }); }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }
  requestAnimationFrame(function () { requestAnimationFrame(check); });

  /* Headline words rise in one by one */
  document.querySelectorAll(".hero h1, .page-hero h1").forEach(function (h) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", n++); s.textContent = t; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(h);
  });
})();
