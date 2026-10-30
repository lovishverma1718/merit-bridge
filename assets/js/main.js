/* Merit Bridge Solutions Inc. — site interactions */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header state on scroll */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.querySelector(".mobile-menu");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (menu) menu.setAttribute("aria-hidden", String(!open));
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
  }
  if (menu) {
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 980) setMenu(false);
  });

  /* Scroll reveal */
  var revealEls = document.querySelectorAll(".reveal, .img-reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Count-up numbers */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    var start = null, duration = 1800;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(countUp);
  }

  /* Hero console: rotating live feed */
  var feed = document.querySelector("[data-feed]");
  if (feed && !reduceMotion) {
    var pool = [
      ["Inbound", "Billing question answered", "Resolved", ""],
      ["Chat", "Order status update sent", "Resolved", ""],
      ["Outbound", "Renewal reminder call", "Booked", "warm"],
      ["Reception", "After-hours call routed", "Routed", ""],
      ["Email", "Warranty claim triaged", "Resolved", ""],
      ["Schedule", "Consultation confirmed", "Booked", "warm"],
      ["Inbound", "New-client intake taken", "Logged", ""],
      ["Outbound", "Customer survey completed", "Done", ""]
    ];
    var i = 0;
    setInterval(function () {
      var item = pool[i % pool.length]; i++;
      var li = document.createElement("li");
      li.className = "enter";
      li.innerHTML = '<span></span><span class="st"></span>';
      li.children[0].textContent = item[0] + " · " + item[1];
      li.children[1].textContent = item[2];
      feed.insertBefore(li, feed.firstChild);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { li.classList.remove("enter"); });
      });
      while (feed.children.length > 3) feed.removeChild(feed.lastChild);
      var big = document.querySelector("[data-live-total]");
      if (big && big.textContent && !isNaN(parseInt(big.textContent, 10))) {
        big.textContent = parseInt(big.textContent, 10) + 1;
      }
    }, 3200);
  }

  /* Live clock (Central Time — Manitoba) */
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var tick = function () {
      try {
        clock.textContent = new Date().toLocaleTimeString("en-CA", {
          hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Winnipeg"
        }) + " CT";
      } catch (e) {
        clock.textContent = "";
      }
    };
    tick();
    setInterval(tick, 30000);
  }

  /* Services sub-nav: highlight active section */
  var svcLinks = document.querySelectorAll(".svc-nav a");
  if (svcLinks.length && "IntersectionObserver" in window) {
    var map = {};
    svcLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          svcLinks.forEach(function (a) { a.classList.remove("active"); });
          var link = map[entry.target.id];
          if (link) {
            link.classList.add("active");
            // Scroll only the pill bar sideways — never the page itself
            var bar = link.closest("ul");
            if (bar && bar.scrollWidth > bar.clientWidth) {
              var offset = link.getBoundingClientRect().left - bar.getBoundingClientRect().left;
              bar.scrollTo({ left: bar.scrollLeft + offset - (bar.clientWidth - link.offsetWidth) / 2, behavior: "smooth" });
            }
          }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) sio.observe(sec);
    });
  }

  /* Contact form → opens the visitor's email client with a pre-filled message */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var preset = params.get("service");
    if (preset) {
      var box = form.querySelector('input[name="services"][value="' + preset.replace(/"/g, "") + '"]');
      if (box) box.checked = true;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.value.trim() !== "" && (input.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        var first = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (first) first.focus();
        return;
      }
      var get = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
      var services = Array.prototype.map.call(form.querySelectorAll('input[name="services"]:checked'), function (c) { return c.value; });
      var body = [
        "Name: " + get("name"),
        "Company: " + get("company"),
        "Email: " + get("email"),
        "Phone: " + get("phone"),
        "Services of interest: " + (services.join(", ") || "Not sure yet"),
        "Expected volume: " + get("volume"),
        "",
        get("message")
      ].join("\n");
      var subject = "Consultation request — " + (get("company") || get("name"));
      window.location.href = "mailto:admin@meritbridgesolution.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var success = form.querySelector(".form-success");
      if (success) success.classList.add("show");
    });

    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });
  }

  /* Back to top */
  document.querySelectorAll("[data-top]").forEach(function (btn) {
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
  });

  /* Year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
