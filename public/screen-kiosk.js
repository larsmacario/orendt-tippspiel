(function () {
  "use strict";

  var SLIDE_DURATION_MS = 22000;
  var POLL_INTERVAL_MS = 45000;
  var POLL_INTERVAL_LIVE_MS = 30000;
  var TICK_MS = 100;

  function destroyKiosk() {
    var state = window.__screenTvKiosk;
    if (!state) return;

    if (state.carouselTimer) clearInterval(state.carouselTimer);
    if (state.pollTimer) clearInterval(state.pollTimer);

    if (state.app) {
      state.app.removeAttribute("data-kiosk-init");
    }

    window.__screenTvKiosk = null;
  }

  function bootScreenTvKiosk() {
    var app = document.querySelector(".screen-tv-app");
    if (!app || app.classList.contains("screen-tv-error")) return false;

    destroyKiosk();

    var slides = Array.prototype.slice.call(document.querySelectorAll(".screen-tv-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".screen-tv-dot"));
    var progressTrack = app.querySelector(".screen-tv-progress-track");
    var tickerEl = document.getElementById("screen-tv-ticker");
    var updatedEl = document.getElementById("screen-tv-updated");

    if (!slides.length) return false;

    app.setAttribute("data-kiosk-init", "1");

    var state = {
      app: app,
      slides: slides,
      dots: dots,
      progressTrack: progressTrack,
      tickerEl: tickerEl,
      updatedEl: updatedEl,
      slideIndex: 0,
      elapsed: 0,
      pollTimer: null,
      carouselTimer: null,
      hasLive: app.getAttribute("data-has-live") === "1",
    };

    window.__screenTvKiosk = state;

    function setProgress(pct) {
      var value = pct + "%";
      app.style.setProperty("--tv-progress", value);
      if (progressTrack) progressTrack.style.setProperty("--tv-progress", value);
    }

    function setActiveSlide(index) {
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.remove("is-active");
        if (dots[i]) dots[i].classList.remove("is-active");
      }
      state.slideIndex = index;
      slides[state.slideIndex].classList.add("is-active");
      if (dots[state.slideIndex]) dots[state.slideIndex].classList.add("is-active");
      setProgress(0);
      state.elapsed = 0;
    }

    function nextSlide() {
      setActiveSlide((state.slideIndex + 1) % slides.length);
    }

    function startCarousel() {
      if (state.carouselTimer) clearInterval(state.carouselTimer);
      state.elapsed = 0;
      setProgress(0);
      state.carouselTimer = setInterval(function () {
        state.elapsed += TICK_MS;
        setProgress(Math.min((state.elapsed / SLIDE_DURATION_MS) * 100, 100));
        if (state.elapsed >= SLIDE_DURATION_MS) {
          nextSlide();
        }
      }, TICK_MS);
    }

    function updateSlidesFromPayload(payload) {
      if (!payload || !payload.slides) return;

      state.hasLive = !!payload.hasLive;
      app.setAttribute("data-has-live", state.hasLive ? "1" : "0");

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
      if (state.pollTimer) clearInterval(state.pollTimer);
      state.pollTimer = setInterval(
        fetchUpdate,
        state.hasLive ? POLL_INTERVAL_LIVE_MS : POLL_INTERVAL_MS
      );
    }

    setActiveSlide(0);
    startCarousel();
    schedulePoll();

    return true;
  }

  window.__screenTvKioskBoot = bootScreenTvKiosk;
  window.__screenTvKioskDestroy = destroyKiosk;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootScreenTvKiosk);
  } else {
    bootScreenTvKiosk();
  }
})();
