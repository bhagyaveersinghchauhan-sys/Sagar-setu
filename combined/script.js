import { db } from "./firebase-core.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const BRAND_NAME = "GeoNetra";
const BRAND_TAGLINE = "Intelligent Hazard Monitoring Network";
const VERIFICATION_STORAGE_KEY = "geonetra_verified";
const SIDEBAR_COLLAPSE_STORAGE_KEY = "geonetra_sidebar_collapsed";
const THEME_STORAGE_KEY = "geonetra_theme";
const DEFAULT_THEME = "dark";
const EMERGENCY_POPUP_DURATION_MS = 10000;
const EMERGENCY_POPUP_DISMISS_MS = 350;
const EMERGENCY_POPUP_SESSION_KEY = "geonetra_emergency_popup_seen";
const NAV_ITEMS = [
  { key: "home", label: "Home", icon: "home", href: { root: "index.html", html: "../index.html" } },
  { key: "dashboard", label: "Dashboard", icon: "layout-dashboard", href: { root: "HTML/dashboard.html", html: "dashboard.html" } },
  { key: "analytics", label: "Analytics", icon: "activity", href: { root: "HTML/analytics.html", html: "analytics.html" } },
  { key: "advisories", label: "Advisories", icon: "book-open-check", href: { root: "HTML/advisories.html", html: "advisories.html" } },
  { key: "report", label: "Report Hazard", icon: "alert-triangle", href: { root: "HTML/hazard.html", html: "hazard.html" } },
  { key: "map", label: "Map Events", icon: "map-pin", href: { root: "HTML/map.html", html: "map.html" } },
  { key: "profile", label: "Profile", icon: "user", href: { root: "HTML/profile.html", html: "profile.html" } }
];
const STORY_LINKS = [
  { buttonId: "story-link-ndrf", destination: "HTML/advisories.html" },
  { buttonId: "story-link-amphan", destination: "HTML/dashboard.html" },
  { buttonId: "story-link-kitchens", destination: "HTML/map.html" }
];

function refreshIcons() {
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function getPageKey() {
  return document.body?.dataset?.page || "home";
}

function isHomePage() {
  return getPageKey() === "home";
}

function isHtmlPage() {
  return !isHomePage();
}

function isVerifiedReporter() {
  return localStorage.getItem(VERIFICATION_STORAGE_KEY) === "true";
}

function migrateLegacyVerificationState() {
  if (isVerifiedReporter()) return;
  const legacyKey = Object.keys(localStorage).find((key) => key !== VERIFICATION_STORAGE_KEY && /verified$/i.test(key) && localStorage.getItem(key) === "true");
  if (legacyKey) {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
  }
}

function getStoredTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : DEFAULT_THEME;
}

function updateThemeToggleState(theme) {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  const nextTheme = theme === "dark" ? "light" : "dark";
  toggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
  toggle.setAttribute("title", `Switch to ${nextTheme} mode`);
  toggle.dataset.theme = theme;
  const iconTarget = toggle.querySelector("[data-theme-icon]");
  if (iconTarget) {
    iconTarget.setAttribute("data-lucide", theme === "dark" ? "sun-medium" : "moon-star");
  }
}

function applyTheme(theme, { persist = true } = {}) {
  document.body.dataset.theme = theme;
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  updateThemeToggleState(theme);
}

function withThemeTransition(callback) {
  document.body.classList.add("theme-transitioning");
  callback();
  window.setTimeout(() => {
    document.body.classList.remove("theme-transitioning");
  }, 320);
}

function getReportDestination() {
  if (isHtmlPage()) {
    return isVerifiedReporter() ? "hazard.html" : "login.html";
  }
  return isVerifiedReporter() ? "HTML/hazard.html" : "HTML/login.html";
}

function getNavHref(item) {
  return item.key === "report" ? getReportDestination() : isHtmlPage() ? item.href.html : item.href.root;
}

function closeMobileSidebar() {
  document.body.classList.remove("mobile-sidebar-open");
}

function injectMobileBackdrop() {
  if (document.querySelector(".mobile-sidebar-backdrop")) return;
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "mobile-sidebar-backdrop";
  backdrop.setAttribute("aria-label", "Close navigation");
  backdrop.addEventListener("click", closeMobileSidebar);
  document.body.appendChild(backdrop);
}

function renderSharedSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const pageKey = getPageKey();

  sidebar.innerHTML = `
    <a href="${isHtmlPage() ? "../index.html" : "index.html"}" class="logo-section">
      <div class="logo-icon">
        <i data-lucide="scan-eye"></i>
      </div>
      <div class="logo-text-col">
        <h1 class="logo-text">${BRAND_NAME}</h1>
        <p class="logo-subtitle">${BRAND_TAGLINE}</p>
      </div>
    </a>
    <nav class="nav-menu">
      ${NAV_ITEMS.map((item) => `
        <a href="${getNavHref(item)}" class="nav-item${item.key === pageKey ? " active" : ""}">
          <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
          <span class="nav-text">${item.label}</span>
        </a>
      `).join("")}
    </nav>
    <div class="sidebar-footer">&copy; 2026 ${BRAND_NAME}</div>
  `;
  sidebar.classList.remove("collapsed");
}

function injectHeaderControls() {
  document.querySelectorAll(".top-header, .analytics-header").forEach((header) => {
    if (!header.querySelector(".mobile-menu-btn")) {
      const menuButton = document.createElement("button");
      menuButton.type = "button";
      menuButton.className = "mobile-menu-btn";
      menuButton.id = "mobileMenuToggle";
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.innerHTML = '<i data-lucide="menu"></i>';
      header.insertBefore(menuButton, header.firstElementChild);
    }

    let actions = header.querySelector(".header-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "header-actions";
      header.appendChild(actions);
    }

    if (!actions.querySelector("#themeToggle")) {
      const themeToggle = document.createElement("button");
      themeToggle.type = "button";
      themeToggle.className = "theme-toggle-btn";
      themeToggle.id = "themeToggle";
      themeToggle.innerHTML = '<i data-theme-icon data-lucide="sun-medium"></i>';
      actions.insertBefore(themeToggle, actions.firstChild);
    }
  });
}

function initializeSidebarToggle() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const sidebar = document.querySelector(".sidebar");

  mobileMenuToggle?.addEventListener("click", () => {
    document.body.classList.toggle("mobile-sidebar-open");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMobileSidebar();
      sidebar?.classList.remove("collapsed");
    } else {
      sidebar?.classList.remove("collapsed");
    }
  });
}

function initializeThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;
  updateThemeToggleState(document.body.dataset.theme || getStoredTheme());
  themeToggle.addEventListener("click", () => {
    const nextTheme = (document.body.dataset.theme || DEFAULT_THEME) === "dark" ? "light" : "dark";
    withThemeTransition(() => applyTheme(nextTheme));
    refreshIcons();
  });
}

function initializeNotificationDropdown() {
  const notifBtn = document.getElementById("home-notification-btn");
  const notifDropdown = document.getElementById("home-notification-dropdown");
  if (!notifBtn || !notifDropdown) return;

  notifBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    notifDropdown.classList.toggle("active");
  });

  document.addEventListener("click", (event) => {
    if (!notifDropdown.contains(event.target) && !notifBtn.contains(event.target)) {
      notifDropdown.classList.remove("active");
    }
  });
}

function initializeStoryLinks() {
  STORY_LINKS.forEach(({ buttonId, destination }) => {
    const button = document.getElementById(buttonId);
    button?.addEventListener("click", () => {
      window.location.href = destination;
    });
  });
}

function initializeStatCounters() {
  const statNumbers = document.querySelectorAll(".stat-number, .counter");
  if (statNumbers.length === 0) return;

  const animateValue = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const value = Math.floor(eased * (end - start) + start);
      element.textContent = element.classList.contains("counter") && end >= 1000 ? value.toLocaleString() : String(value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = Number(entry.target.getAttribute("data-target"));
      if (!Number.isFinite(target)) return;
      animateValue(entry.target, 0, target, 1500);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  statNumbers.forEach((item) => observer.observe(item));
}

function injectEmergencyPopup() {
  if (document.querySelector(".emergency-popup")) return;
  const popup = document.createElement("div");
  popup.className = "emergency-popup";
  popup.id = "emergencyPopup";
  popup.innerHTML = `
    <div class="hazard-card" role="dialog" aria-modal="false" aria-labelledby="emergencyPopupTitle">
      <div class="hazard-header">
        <div class="hazard-icon-warning">
          <i data-lucide="siren"></i>
        </div>
        <div class="hazard-content">
          <h4 class="hazard-title" id="emergencyPopupTitle">Emergency Reporting Window</h4>
          <p class="hazard-message">See smoke, flooding, shoreline damage, or another urgent threat? File a hazard report now so the map updates quickly.</p>
        </div>
      </div>
      <div class="hazard-actions">
        <a class="hazard-cta-btn" href="${getReportDestination()}">
          <i data-lucide="arrow-up-right"></i>
          <span>Report Hazard</span>
        </a>
        <div style="display:flex;align-items:center;gap:.6rem;">
          <div class="hazard-timer" id="emergencyPopupTimer">10</div>
          <button class="hazard-close-btn" id="emergencyPopupClose" type="button" aria-label="Close emergency popup">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

function initializeEmergencyPopup() {
  const popup = document.getElementById("emergencyPopup");
  const closeButton = document.getElementById("emergencyPopupClose");
  const timerElement = document.getElementById("emergencyPopupTimer");
  if (!popup || !closeButton || !timerElement) return;
  if (sessionStorage.getItem(EMERGENCY_POPUP_SESSION_KEY) === "true") return;

  let remainingSeconds = 10;
  let intervalId = null;

  const hidePopup = () => {
    popup.classList.add("is-hiding");
    popup.classList.remove("is-visible");
    if (intervalId) {
      window.clearInterval(intervalId);
    }
    window.setTimeout(() => {
      popup.classList.remove("is-hiding");
    }, EMERGENCY_POPUP_DISMISS_MS);
  };

  sessionStorage.setItem(EMERGENCY_POPUP_SESSION_KEY, "true");
  popup.classList.add("is-visible");
  intervalId = window.setInterval(() => {
    remainingSeconds -= 1;
    timerElement.textContent = String(remainingSeconds);
    if (remainingSeconds <= 0) {
      hidePopup();
    }
  }, 1000);

  closeButton.addEventListener("click", hidePopup, { once: true });
  window.setTimeout(() => {
    if (popup.classList.contains("is-visible")) {
      hidePopup();
    }
  }, EMERGENCY_POPUP_DURATION_MS);
}

function initializeHomeInteractions() {
  document.querySelectorAll(".read-more-btn[data-expand-card]").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".resilience-card");
      if (!card) return;
      const expanded = card.classList.toggle("expanded");
      const text = button.querySelector(".btn-text");
      if (text) {
        text.textContent = expanded ? "Show Less" : "Read Story";
      }
    });
  });
}

function initializeAnimatedLoginBg() {
  const animatedBody = document.querySelector(".login-page-animated-bg");
  if (!animatedBody) return;
  document.addEventListener("mousemove", (event) => {
    animatedBody.style.setProperty("--mouse-x", `${(event.clientX / window.innerWidth) * 100}%`);
    animatedBody.style.setProperty("--mouse-y", `${(event.clientY / window.innerHeight) * 100}%`);
  });
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "Reported recently";
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Reported recently";
  const diffMs = Date.now() - date.getTime();
  const minute = 60000;
  const hour = minute * 60;
  const day = hour * 24;
  if (diffMs < minute) return "Reported just now";
  if (diffMs < hour) {
    const minutes = Math.floor(diffMs / minute);
    return `Reported ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `Reported ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(diffMs / day);
  return `Reported ${days} day${days === 1 ? "" : "s"} ago`;
}

function formatLanguageName(languageCode) {
  if (!languageCode) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(languageCode) || languageCode;
  } catch {
    return languageCode;
  }
}

async function geocodeAddress(address) {
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const data = await response.json();
      if (data.features?.length) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        return { lat, lng };
      }
    }
  } catch (error) {
    console.warn("Photon geocoding fallback:", error);
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, { headers: { Accept: "application/json" } });
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: Number.parseFloat(data[0].lat), lng: Number.parseFloat(data[0].lon) };
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
}

async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.display_name || null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

function initializeHazardPageHelpers() {
  const hazardMapEl = document.getElementById("hazard-map");
  const detectBtn = document.getElementById("detect-location");
  const searchBtn = document.getElementById("loc-btn-search");
  const locInput = document.getElementById("h-location");
  const latInput = document.getElementById("h-lat");
  const lngInput = document.getElementById("h-lng");
  const confirmLocBtn = document.getElementById("confirm-location-btn");
  const submitBtn = document.getElementById("submit-btn");

  if (hazardMapEl && typeof L !== "undefined") {
    const map = L.map("hazard-map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    const marker = L.marker([20.5937, 78.9629], { draggable: true }).addTo(map);
    window.setTimeout(() => map.invalidateSize(), 400);

    const updateLocationDetails = (lat, lng, flyTo = false) => {
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);
      marker.setLatLng([lat, lng]);
      if (flyTo) map.flyTo([lat, lng], 13, { animate: true });
      if (confirmLocBtn) {
        confirmLocBtn.disabled = false;
        confirmLocBtn.innerHTML = '<i data-lucide="check-circle"></i> Confirm Location on Map';
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
      }
      refreshIcons();
    };

    const syncLocationLabel = async (lat, lng) => {
      if (!locInput) return;
      locInput.value = "Fetching address...";
      locInput.value = await reverseGeocode(lat, lng) || "Pinned Location";
    };

    map.on("click", async ({ latlng }) => {
      updateLocationDetails(latlng.lat, latlng.lng);
      await syncLocationLabel(latlng.lat, latlng.lng);
    });

    marker.on("dragend", async () => {
      const position = marker.getLatLng();
      updateLocationDetails(position.lat, position.lng);
      await syncLocationLabel(position.lat, position.lng);
    });

    detectBtn?.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        updateLocationDetails(latitude, longitude, true);
        await syncLocationLabel(latitude, longitude);
      }, () => {
        alert("Could not get your location. Please search or drop a pin manually.");
      });
    });

    if (searchBtn && locInput) {
      searchBtn.addEventListener("click", async () => {
        const address = locInput.value.trim();
        if (!address) {
          alert("Please enter an address to search.");
          return;
        }
        const coords = await geocodeAddress(address);
        if (!coords) {
          alert("Address not found. Please try another address or use the map.");
          return;
        }
        updateLocationDetails(coords.lat, coords.lng, true);
      });
    }

    if (confirmLocBtn && submitBtn) {
      confirmLocBtn.addEventListener("click", () => {
        if (!latInput?.value || !lngInput?.value) {
          alert("Please pin the hazard location first.");
          return;
        }
        confirmLocBtn.disabled = true;
        confirmLocBtn.innerHTML = '<i data-lucide="check-square"></i> Location Confirmed';
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        refreshIcons();
      });
    }
  }

  const photoInput = document.getElementById("photoInput");
  const photoPreviewWrap = document.getElementById("photoPreviewWrap");
  const photoPreview = document.getElementById("photoPreview");
  const photoPreviewName = document.getElementById("photoPreviewName");
  const hazardForm = document.getElementById("hazard-form");
  let previewUrl = null;

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    if (photoPreview) photoPreview.removeAttribute("src");
    if (photoPreviewName) photoPreviewName.textContent = "";
    if (photoPreviewWrap) photoPreviewWrap.hidden = true;
  };

  photoInput?.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) {
      clearPreview();
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (photoPreview) photoPreview.src = previewUrl;
    if (photoPreviewName) photoPreviewName.textContent = file.name;
    if (photoPreviewWrap) photoPreviewWrap.hidden = false;
  });

  hazardForm?.addEventListener("reset", () => window.setTimeout(clearPreview, 0));
}

function initializeMapPage() {
  const mapEl = document.getElementById("map");
  if (!mapEl || typeof L === "undefined") return;

  const map = L.map("map", { maxBoundsViscosity: 1, minZoom: 3, maxZoom: 19 }).setView([20.5937, 78.9629], 5);
  const bounds = [[-90, -180], [90, 180]];
  map.setMaxBounds(bounds);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors", noWrap: true, bounds }).addTo(map);

  const hazardLayer = L.layerGroup().addTo(map);
  const socialRadarLayer = L.layerGroup().addTo(map);
  const socialRadarBtn = document.getElementById("social-radar-btn");
  const socialRadarStatus = document.getElementById("social-radar-status");
  const hazardPanel = document.getElementById("hazard-panel");
  const closePanelBtn = document.getElementById("close-panel");
  const summarySection = document.getElementById("panel-summary-section");
  const summaryText = document.getElementById("panel-summary-text");
  const summaryLanguage = document.getElementById("panel-summary-language");
  const summaryTabsWrap = document.getElementById("panel-summary-tabs");
  const summaryTabs = Array.from(document.querySelectorAll(".summary-tab"));
  let currentSummary = null;

  const getHazardIcon = (type) => {
    const normalized = String(type || "").toLowerCase();
    if (normalized.includes("flood") || normalized.includes("water")) return "🌊";
    if (normalized.includes("wave") || normalized.includes("coast")) return "💨";
    if (normalized.includes("cyclone") || normalized.includes("storm")) return "🌪️";
    if (normalized.includes("fire") || normalized.includes("heat")) return "🔥";
    if (normalized.includes("earthquake")) return "🌋";
    return "⚠️";
  };

  const createMarkerIcon = (icon, color) => L.divIcon({
    className: "custom-marker",
    html: `<div style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${color};border:2px solid #fff;box-shadow:0 10px 18px rgba(15,23,42,.25);font-size:16px;">${icon}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });

  const getSummaryText = (summary, language) => {
    if (!summary) return "";
    if (language === "english") return summary.english || "";
    if (language === "hindi") return summary.hindi || "";
    return summary.original || "";
  };

  const updateSummaryPanel = (language) => {
    if (!summarySection || !summaryText || !summaryTabsWrap) return;
    const nextText = getSummaryText(currentSummary, language);
    if (!currentSummary || !nextText) {
      summarySection.hidden = true;
      summaryTabsWrap.hidden = true;
      summaryText.textContent = "";
      if (summaryLanguage) summaryLanguage.textContent = "";
      return;
    }
    summarySection.hidden = false;
    summaryText.textContent = nextText;
    if (summaryLanguage) {
      summaryLanguage.textContent = currentSummary.sourceLanguage ? `Source: ${formatLanguageName(currentSummary.sourceLanguage)}` : "";
    }

    let visibleTabs = 0;
    summaryTabs.forEach((tab) => {
      const hasText = Boolean(getSummaryText(currentSummary, tab.dataset.summaryLang));
      tab.hidden = !hasText;
      tab.classList.toggle("active", hasText && tab.dataset.summaryLang === language);
      if (hasText) visibleTabs += 1;
    });
    summaryTabsWrap.hidden = visibleTabs <= 1;
  };

  summaryTabs.forEach((tab) => {
    tab.addEventListener("click", () => updateSummaryPanel(tab.dataset.summaryLang));
  });

  const openHazardPanel = (details) => {
    const actualPanel = hazardPanel || document.getElementById("hazard-panel");
    if (!actualPanel) {
      console.error("Hazard panel element not found in the DOM.");
      return;
    }

    // Ensure it opens even if content updates fail
    actualPanel.classList.remove("collapsed");

    try {
      const elType = document.getElementById("panel-type");
      const elIcon = document.getElementById("panel-icon");
      const elLoc = document.getElementById("panel-location");
      const elTime = document.getElementById("panel-time");
      const elSev = document.getElementById("panel-severity");

      if (elType) elType.textContent = details.type || "Unknown Event";
      if (elIcon) elIcon.textContent = details.iconStr || "⚠️";
      if (elLoc) elLoc.textContent = details.title || "Unknown Location";
      if (elTime) elTime.textContent = details.timeStr || "Recently reported";
      
      if (elSev) {
        elSev.textContent = details.severity || "medium";
        elSev.className = `severity-badge severity-${details.severity || 'medium'}`;
      }

      const photoSection = document.getElementById("panel-photo-section");
      const photo = document.getElementById("panel-photo");
      if (photoSection && photo) {
        if (details.photoUrl) {
          photo.src = details.photoUrl;
          photoSection.hidden = false;
        } else {
          photo.removeAttribute("src");
          photoSection.hidden = true;
        }
      }

      currentSummary = details.summary || null;
      updateSummaryPanel(details.summary?.original ? "original" : details.summary?.english ? "english" : "hindi");
      
      if (map && details.latlng) {
        map.flyTo(details.latlng, 12, { animate: true, duration: 1 });
      }
    } catch (err) {
      console.warn("Error updating hazard panel content:", err);
    }
  };

  closePanelBtn?.addEventListener("click", () => hazardPanel?.classList.add("collapsed"));

  const setSocialRadarStatus = (message, tone = "neutral") => {
    if (!socialRadarStatus) return;
    socialRadarStatus.hidden = !message;
    socialRadarStatus.textContent = message || "";
    socialRadarStatus.dataset.tone = tone;
  };

  socialRadarBtn?.addEventListener("click", async () => {
    socialRadarBtn.disabled = true;
    socialRadarBtn.innerHTML = '<i data-lucide="loader-circle"></i> Scanning...';
    refreshIcons();
    socialRadarLayer.clearLayers();
    setSocialRadarStatus("Scanning Jaipur social posts for possible emergencies...");
    try {
      const response = await fetch("http://localhost:3000/api/scan-reddit?mode=demo");
      const hazards = await response.json();
      if (!response.ok) {
        throw new Error(hazards?.error || "Social radar scan failed.");
      }

      let count = 0;
      for (const hazard of hazards) {
        const coords = await geocodeAddress(`${hazard.location_clues}, Jaipur, Rajasthan, India`);
        if (!coords) continue;
        const marker = L.marker([coords.lat, coords.lng], { icon: createMarkerIcon(getHazardIcon(hazard.hazard_type), "#0ea5e9") });
        marker.on("click", () => {
          openHazardPanel({
            type: `Social Radar: ${hazard.hazard_type}`,
            title: hazard.location_clues,
            rawText: hazard.description,
            severity: "medium",
            iconStr: getHazardIcon(hazard.hazard_type),
            latlng: [coords.lat, coords.lng],
            timeStr: "Detected just now",
            photoUrl: null,
            summary: null
          });
        });
        marker.addTo(socialRadarLayer);
        count += 1;
      }

      setSocialRadarStatus(count ? `Social Radar added ${count} AI-detected marker${count === 1 ? "" : "s"} to the map.` : "No social hazard posts could be placed on the map this time.", count ? "success" : "neutral");
    } catch (error) {
      console.error("Social radar scan failed:", error);
      setSocialRadarStatus("Social Radar scan failed. Start the backend and try again.", "error");
    } finally {
      socialRadarBtn.disabled = false;
      socialRadarBtn.innerHTML = '<i data-lucide="radio-tower"></i> Scan Social Radar';
      refreshIcons();
    }
  });

  try {
    onSnapshot(collection(db, "hazards"), (snapshot) => {
      hazardLayer.clearLayers();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.latitude == null || data.longitude == null) return;
        const reportedAt = data.timestamp?.toDate ? data.timestamp.toDate() : null;
        const severityColor = data.severity === "high" ? "#ef4444" : data.severity === "medium" ? "#f59e0b" : "#10b981";
        const marker = L.marker([data.latitude, data.longitude], {
          icon: createMarkerIcon(getHazardIcon(data.type), severityColor)
        });
        marker.bindTooltip(`<strong>${data.type}</strong><br>${data.location}<br><em>${formatRelativeTime(reportedAt)}</em>`, { direction: "top", offset: [0, -10], opacity: 0.92 });
        marker.on("click", () => {
          openHazardPanel({
            type: data.type,
            title: data.location,
            rawText: data.rawText || data.description || "No additional details available.",
            severity: data.severity || "medium",
            iconStr: getHazardIcon(data.type),
            latlng: [data.latitude, data.longitude],
            timeStr: reportedAt ? reportedAt.toLocaleTimeString() : "Recently reported",
            photoUrl: data.photoUrl || null,
            summary: {
              original: data.summaryOriginal || data.aiSummaryOriginal || null,
              english: data.summaryEnglish || data.aiSummaryEnglish || null,
              hindi: data.summaryHindi || data.aiSummaryHindi || null,
              sourceLanguage: data.sourceLanguage || null
            }
          });
        });
        marker.addTo(hazardLayer);
      });
    });
  } catch (error) {
    console.warn("Realtime hazard listener failed:", error);
  }
}

function initializeLoginFlow() {
  const phoneForm = document.getElementById("phone-form");
  const otpForm = document.getElementById("otp-form");
  const resendBtn = document.getElementById("resend-btn");
  const stepPhone = document.getElementById("step-phone");
  const stepOtp = document.getElementById("step-otp");
  const otpHint = document.getElementById("otp-hint");

  phoneForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = document.getElementById("phone").value.trim();
    if (!/^[0-9]{10}$/.test(phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    if (otpHint) otpHint.textContent = `A 6-digit code was sent to ${phone}`;
    if (stepPhone) stepPhone.style.display = "none";
    if (stepOtp) stepOtp.style.display = "block";
    document.getElementById("otp")?.focus();
  });

  otpForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const otp = document.getElementById("otp").value.trim();
    if (otp.length !== 6) return;

    const submitBtn = otpForm.querySelector(".login-submit-btn");
    const originalContent = submitBtn.innerHTML;

    // Premium "Verifying" state
    submitBtn.classList.add("verifying");
    submitBtn.innerHTML = '<div class="spinner"></div> <span>Verifying...</span>';

    window.setTimeout(() => {
      localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
      window.location.href = "hazard.html";
    }, 1200);
  });

  resendBtn?.addEventListener("click", () => {
    document.getElementById("otp").value = "";
    if (stepOtp) stepOtp.style.display = "none";
    if (stepPhone) stepPhone.style.display = "block";
  });

  if (window.location.pathname.includes("hazard.html") && !isVerifiedReporter()) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  migrateLegacyVerificationState();
  applyTheme(getStoredTheme(), { persist: false });
  injectMobileBackdrop();
  renderSharedSidebar();
  injectHeaderControls();
  injectEmergencyPopup();
  initializeSidebarToggle();
  initializeThemeToggle();
  initializeNotificationDropdown();
  initializeStoryLinks();
  initializeStatCounters();
  initializeHomeInteractions();
  initializeAnimatedLoginBg();
  initializeHazardPageHelpers();
  initializeMapPage();
  initializeLoginFlow();
  initializeEmergencyPopup();

  refreshIcons();
});
