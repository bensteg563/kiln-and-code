(() => {
  const MEASUREMENT_ID = "G-BB3CNC5RTB";
  const STORAGE_KEY = "kiln_code_analytics_consent";
  const banner = document.querySelector("[data-cookie-banner]");
  const settingsButtons = document.querySelectorAll("[data-cookie-settings]");
  const acceptButton = document.querySelector("[data-cookie-accept]");
  const declineButton = document.querySelector("[data-cookie-decline]");
  let analyticsLoaded = false;

  function populateLeadAttribution() {
    const form = document.querySelector(".enquiry-form");
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const values = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      landing_page: window.location.href.split("#")[0],
      referrer: document.referrer || ""
    };

    Object.entries(values).forEach(([key, value]) => {
      const input = form.querySelector(`[data-attribution="${key}"]`);
      if (input) input.value = value;
    });
  }

  populateLeadAttribution();

  function sendEvent(name, params = {}) {
    if (!window.gtag || getChoice() !== "granted") return;
    window.gtag("event", name, params);
  }

  function bindAnalyticsEvents() {
    document.querySelectorAll("[data-ga-event]").forEach((element) => {
      element.addEventListener("click", () => {
        sendEvent(element.dataset.gaEvent, {
          event_label: element.dataset.gaLabel || element.textContent.trim().slice(0, 80)
        });
      });
    });

    const form = document.querySelector(".enquiry-form");
    if (form) {
      let started = false;
      form.addEventListener("focusin", () => {
        if (started) return;
        started = true;
        sendEvent("form_start", { form_name: "website_enquiry" });
      });
    }
  }

  bindAnalyticsEvents();

  function getChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function saveChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (_) {}
  }

  function clearAnalyticsCookies() {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!name.startsWith("_ga")) return;
      document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
      document.cookie = name + "=; Max-Age=0; path=/; domain=.kilnandcode.co.uk; SameSite=Lax";
    });
  }

  function loadAnalytics() {
    if (analyticsLoaded || window.__kilnCodeAnalyticsLoaded) return;
    analyticsLoaded = true;
    window.__kilnCodeAnalyticsLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);

    if (document.body.dataset.analyticsEvent === "generate_lead") {
      let alreadySent = false;
      try {
        alreadySent = sessionStorage.getItem("kiln_code_generate_lead_sent") === "yes";
      } catch (_) {}
      if (!alreadySent) {
        window.gtag("event", "generate_lead", { method: "website_form" });
        try { sessionStorage.setItem("kiln_code_generate_lead_sent", "yes"); } catch (_) {}
      }
    }
  }

  function showBanner() {
    if (!banner) return;
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add("is-visible"));
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("is-visible");
    window.setTimeout(() => { banner.hidden = true; }, 180);
  }

  function setConsent(value) {
    saveChoice(value);
    hideBanner();

    if (value === "granted") {
      loadAnalytics();
      return;
    }

    if (analyticsLoaded || window.__kilnCodeAnalyticsLoaded) {
      if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
      clearAnalyticsCookies();
      window.setTimeout(() => window.location.reload(), 220);
    } else {
      clearAnalyticsCookies();
    }
  }

  const choice = getChoice();
  if (choice === "granted") {
    loadAnalytics();
  } else if (choice !== "denied") {
    showBanner();
  }

  acceptButton?.addEventListener("click", () => setConsent("granted"));
  declineButton?.addEventListener("click", () => setConsent("denied"));
  settingsButtons.forEach((button) => button.addEventListener("click", showBanner));
})();
