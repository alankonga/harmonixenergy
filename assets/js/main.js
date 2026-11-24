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

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }); }, { threshold: .12 });
    document.querySelectorAll(".reveal").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top > window.innerHeight) { el.classList.add("pre"); io.observe(el); } });
  } else document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
})();
