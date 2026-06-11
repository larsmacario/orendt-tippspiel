(function () {
  "use strict";

  var SLIDE_DURATION_MS = 22000;
  var POLL_INTERVAL_MS = 45000;
  var POLL_INTERVAL_LIVE_MS = 30000;
  var TICK_MS = 100;
  var FADE_MS = 300;

  var app = document.querySelector(".screen-tv-app");
  if (!app || app.classList.contains("screen-tv-error")) return;

  var slides = Array.prototype.slice.call(document.querySelectorAll(".screen-tv-slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".screen-tv-dot"));
  var progressBar = document.getElementById("screen-tv-progress");
  var tickerEl = document.getElementById("screen-tv-ticker");
  var updatedEl = document.getElementById("screen-tv-updated");

  if (!slides.length) return;

  var slideIndex = 0;
  var elapsed = 0;
  var pollTimer = null;
  var carouselTimer = null;
  var hasLive = app.getAttribute("data-has-live") === "1";

  function setActiveSlide(index) {
    for (var i = 0; i < slides.length; i++) {
      slides[i].classList.remove("is-active", "is-fading");
      if (dots[i]) dots[i].classList.remove("is-active");
    }
    slideIndex = index;
    slides[slideIndex].classList.add("is-active");
    if (dots[slideIndex]) dots[slideIndex].classList.add("is-active");
    if (progressBar) progressBar.style.width = "0%";
    elapsed = 0;
  }

  function nextSlide() {
    var current = slides[slideIndex];
    if (current) current.classList.add("is-fading");
    setTimeout(function () {
      setActiveSlide((slideIndex + 1) % slides.length);
    }, FADE_MS);
  }

  function startCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    elapsed = 0;
    carouselTimer = setInterval(function () {
      elapsed += TICK_MS;
      if (progressBar) {
        progressBar.style.width = Math.min((elapsed / SLIDE_DURATION_MS) * 100, 100) + "%";
      }
      if (elapsed >= SLIDE_DURATION_MS) {
        nextSlide();
      }
    }, TICK_MS);
  }

  function updateSlidesFromPayload(payload) {
    if (!payload || !payload.slides) return;

    hasLive = !!payload.hasLive;
    app.setAttribute("data-has-live", hasLive ? "1" : "0");

    if (updatedEl && payload.updatedAtFormatted) {
      updatedEl.textContent = "Aktualisiert " + payload.updatedAtFormatted;
    }

    if (tickerEl) {
      tickerEl.innerHTML = payload.tickerHtml || "";
    }

    for (var i = 0; i < payload.slides.length; i++) {
      var item = payload.slides[i];
      var slideEl = slides[i];
      if (slideEl && item && item.html != null) {
        slideEl.innerHTML = item.html;
      }
    }

    schedulePoll();
  }

  function fetchUpdate() {
    if (typeof fetch !== "function") return;

    fetch("/api/screen/tv/render")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (payload) {
        updateSlidesFromPayload(payload);
      })
      .catch(function () {
        /* Beim Poll-Fehler letzte Anzeige beibehalten */
      });
  }

  function schedulePoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(fetchUpdate, hasLive ? POLL_INTERVAL_LIVE_MS : POLL_INTERVAL_MS);
  }

  setActiveSlide(0);
  startCarousel();
  schedulePoll();
})();
