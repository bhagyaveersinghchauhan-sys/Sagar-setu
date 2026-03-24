// script.js - Shared UI logic, map behavior, and Social Radar integration
import { db } from "./firebase-core.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const BRAND_NAME = "GeoNetra";
const BRAND_TAGLINE = "Intelligent Hazard Monitoring Network";
const VERIFICATION_STORAGE_KEY = "geonetra_verified";
const SIDEBAR_COLLAPSE_STORAGE_KEY = "geonetra_sidebar_collapsed";
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
  {
    buttonId: "story-link-ndrf",
    destination: "HTML/advisories.html",
    label: "Explore Advisories"
  },
  {
    buttonId: "story-link-amphan",
    destination: "HTML/dashboard.html",
    label: "View Dashboard"
  },
  {
    buttonId: "story-link-kitchens",
    destination: "HTML/map.html",
    label: "Open Live Map"
  }
];

function getPageKey() {
  return document.body?.dataset?.page || "home";
}

function isHtmlPage() {
  const pageKey = getPageKey();
  return pageKey !== "home";
}

function isVerifiedReporter() {
  return localStorage.getItem(VERIFICATION_STORAGE_KEY) === "true";
}

function migrateLegacyVerificationState() {
  if (localStorage.getItem(VERIFICATION_STORAGE_KEY) === "true") return;

  const legacyVerifiedKey = Object.keys(localStorage).find((key) => {
    if (key === VERIFICATION_STORAGE_KEY || !/verified$/i.test(key)) {
      return false;
    }

    return localStorage.getItem(key) === "true";
  });

  if (legacyVerifiedKey) {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
  }
}

function getReportDestination() {
  if (isHtmlPage()) {
    return isVerifiedReporter() ? "hazard.html" : "login.html";
  }

  return isVerifiedReporter() ? "HTML/hazard.html" : "HTML/login.html";
}

function getNavHref(item) {
  if (item.key === "report") {
    return getReportDestination();
  }

  return isHtmlPage() ? item.href.html : item.href.root;
}

function renderSharedSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const pageKey = getPageKey();
  const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY) === "true";

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

    <button class="sidebar-toggle" id="sidebarToggle" title="Toggle Sidebar" type="button" aria-label="Toggle Sidebar">
      <i data-lucide="chevron-left"></i>
    </button>

    <nav class="nav-menu">
      ${NAV_ITEMS.map((item) => {
        const isActive = item.key === pageKey;
        return `
          <a href="${getNavHref(item)}" class="nav-item${isActive ? " active" : ""}">
            <span class="nav-icon"><i data-lucide="${item.icon}"></i></span>
            <span class="nav-text">${item.label}</span>
          </a>
        `;
      }).join("")}
    </nav>

    <div class="sidebar-footer">&copy; 2026 ${BRAND_NAME}</div>
  `;

  sidebar.classList.toggle("collapsed", isCollapsed);
}

function initializeSidebarToggle() {
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");

  if (!sidebarToggle || !sidebar) return;

  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    localStorage.setItem(SIDEBAR_COLLAPSE_STORAGE_KEY, String(isCollapsed));
  });
}

function initializeStoryLinks() {
  STORY_LINKS.forEach((story) => {
    const button = document.getElementById(story.buttonId);
    if (!button) return;

    button.addEventListener("click", () => {
      window.location.href = story.destination;
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  migrateLegacyVerificationState();
  renderSharedSidebar();
  initializeSidebarToggle();
  initializeStoryLinks();

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  const notifBtn = document.getElementById("home-notification-btn");
  const notifDropdown = document.getElementById("home-notification-dropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove("active");
      }
    });
  }

  const animatedBody = document.querySelector(".login-page-animated-bg");
  if (animatedBody) {
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      animatedBody.style.setProperty("--mouse-x", `${x}%`);
      animatedBody.style.setProperty("--mouse-y", `${y}%`);
    });
  }

  const statNumbers = document.querySelectorAll(".stat-number");
  if (statNumbers.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute("data-target"), 10);
          animateValue(entry.target, 0, target, 1500);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach((num) => observer.observe(num));
  }

  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  function formatRelativeTime(dateValue) {
    if (!dateValue) return "Reported recently";

    const reportDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(reportDate.getTime())) return "Reported recently";

    const diffMs = Date.now() - reportDate.getTime();
    if (diffMs < 0) return "Reported just now";

    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (diffMs < minuteMs) return "Reported just now";
    if (diffMs < hourMs) {
      const minutes = Math.floor(diffMs / minuteMs);
      return `Reported ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }
    if (diffMs < dayMs) {
      const hours = Math.floor(diffMs / hourMs);
      return `Reported ${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(diffMs / dayMs);
    return `Reported ${days} day${days === 1 ? "" : "s"} ago`;
  }

  function formatLanguageName(languageCode) {
    if (!languageCode) return "";

    try {
      return new Intl.DisplayNames(["en"], { type: "language" }).of(languageCode) || languageCode;
    } catch (err) {
      return languageCode;
    }
  }

  async function geocodeAddress(address) {
    try {
      // Using Photon (Komoot) for much more forgiving, fuzzy geocoding than strict Nominatim
      const endpoint = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          // Photon returns coordinates as [lon, lat]
          const [lng, lat] = data.features[0].geometry.coordinates;
          return { lat, lng };
        }
      }
    } catch (err) {
      console.warn("Photon geocoding error, falling back to Nominatim:", err);
    }

    // Fallback to strict Nominatim
    try {
      const nomEndpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const nomRes = await fetch(nomEndpoint, { headers: { Accept: "application/json" } });
      if (!nomRes.ok) return null;
      const nomData = await nomRes.json();
      if (!Array.isArray(nomData) || nomData.length === 0) return null;
      return { lat: parseFloat(nomData[0].lat), lng: parseFloat(nomData[0].lon) };
    } catch (err) {
      console.error("Geocoding completely failed:", err);
      return null;
    }
  }

  // --- Hazard Map Logic (Report Hazard Page) ---
  const hazardMapEl = document.getElementById("hazard-map");
  const detectBtn = document.getElementById("detect-location");
  const searchBtn = document.getElementById("loc-btn-search");
  const locInput = document.getElementById("h-location");
  const latInput = document.getElementById("h-lat");
  const lngInput = document.getElementById("h-lng");
  const confirmLocBtn = document.getElementById("confirm-location-btn");
  const submitBtn = document.getElementById("submit-btn");

  async function reverseGeocode(lat, lng) {
    try {
      const endpoint = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.display_name ? data.display_name : null;
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return null;
    }
  }

  if (hazardMapEl && typeof L !== "undefined") {
    // Default to India
    const hMap = L.map("hazard-map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(hMap);

    let hazardMarker = L.marker([20.5937, 78.9629], { draggable: true }).addTo(hMap);
    
    // Fix map rendering issues inside flex containers (timeout ensures layout is done)
    setTimeout(() => { hMap.invalidateSize(); }, 500);

    function updateLocationDetails(lat, lng, flyTo = false) {
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);
      hazardMarker.setLatLng([lat, lng]);
      if (flyTo) hMap.flyTo([lat, lng], 13, { animate: true });
      
      // Unlock confirm button whenever location changes
      if (confirmLocBtn) {
        confirmLocBtn.disabled = false;
        confirmLocBtn.innerHTML = '<i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> Confirm Location on Map';
        confirmLocBtn.style.backgroundColor = 'var(--card-bg)';
        confirmLocBtn.style.color = 'var(--primary)';
        // Disable submit button again if location changes until reconfirmed
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
        if (typeof lucide !== "undefined") lucide.createIcons();
      }
    }

    // 1. Drop Pin: Click on Map
    hMap.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      updateLocationDetails(lat, lng);
      if (locInput) {
        locInput.value = "Fetching address...";
        const addressName = await reverseGeocode(lat, lng);
        locInput.value = addressName || "Dropped Pin Location";
      }
    });

    // 2. Drag Pin
    hazardMarker.on('dragend', async () => {
      const { lat, lng } = hazardMarker.getLatLng();
      updateLocationDetails(lat, lng);
      if (locInput) {
        locInput.value = "Fetching address...";
        const addressName = await reverseGeocode(lat, lng);
        locInput.value = addressName || "Dropped Pin Location";
      }
    });

    // 3. Detect My Location
    if (detectBtn) {
      detectBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          return;
        }
        detectBtn.innerHTML = '<i data-lucide="loader"></i> Detecting...';
        if (typeof lucide !== "undefined") lucide.createIcons();

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            updateLocationDetails(lat, lng, true);
            
            detectBtn.innerHTML = '<i data-lucide="check"></i> Done';
            if (typeof lucide !== "undefined") lucide.createIcons();
            
            if (locInput) {
              locInput.value = "Fetching address...";
              const addressName = await reverseGeocode(lat, lng);
              locInput.value = addressName || "My Current Location";
            }
          },
          () => {
            detectBtn.innerHTML = '<i data-lucide="locate"></i> Auto Detect';
            if (typeof lucide !== "undefined") lucide.createIcons();
            alert("Could not get your location. Please drop a pin or search.");
          }
        );
      });
    }

    // 4. Search Address
    if (searchBtn && locInput) {
      searchBtn.addEventListener("click", async () => {
        const address = locInput.value.trim();
        if (!address) {
          alert("Please enter an address to search.");
          return;
        }
        searchBtn.innerHTML = '<i data-lucide="loader"></i>';
        if (typeof lucide !== "undefined") lucide.createIcons();
        
        try {
          const coords = await geocodeAddress(address);
          if (coords) {
            updateLocationDetails(coords.lat, coords.lng, true);
          } else {
            alert("Address not found. Please try another or drop a pin.");
          }
        } catch (e) {
          alert("Error searching address. Please drop a pin manually.");
        } finally {
          searchBtn.textContent = "Search Map";
        }
      });
      // Optionally allow "Enter" key in input
      locInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          searchBtn.click();
        }
      });
    }

    // 5. Confirm Location Button
    if (confirmLocBtn && submitBtn) {
      confirmLocBtn.addEventListener("click", () => {
        if (!latInput.value || !lngInput.value) {
            alert("Please locate the hazard on the map first.");
            return;
        }
        
        // Lock it in
        confirmLocBtn.disabled = true;
        confirmLocBtn.innerHTML = '<i data-lucide="check-square" style="width: 18px; height: 18px;"></i> Location Confirmed!';
        confirmLocBtn.style.backgroundColor = 'var(--success)';
        confirmLocBtn.style.color = 'white';
        confirmLocBtn.style.borderColor = 'var(--success)';
        
        // Enable Submission
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        
        if (typeof lucide !== "undefined") lucide.createIcons();
      });
    }
  } else {
    // If not on hazard page, provide the fallback minimal logic
    if (detectBtn) {
      detectBtn.addEventListener("click", () => {
        if (!navigator.geolocation) return;
        detectBtn.textContent = "Detecting...";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latEl = document.getElementById("h-lat");
            const lngEl = document.getElementById("h-lng");
            if(latEl) latEl.value = pos.coords.latitude.toFixed(6);
            if(lngEl) lngEl.value = pos.coords.longitude.toFixed(6);
            detectBtn.innerHTML = '<i data-lucide="check"></i> Done';
            if (typeof lucide !== "undefined") lucide.createIcons();
          },
          () => {
            detectBtn.innerHTML = '<i data-lucide="locate"></i> Detect';
            if (typeof lucide !== "undefined") lucide.createIcons();
            alert("Could not get your location.");
          }
        );
      });
    }
  }

  const photoInput = document.getElementById("photoInput");
  const photoPreviewWrap = document.getElementById("photoPreviewWrap");
  const photoPreview = document.getElementById("photoPreview");
  const photoPreviewName = document.getElementById("photoPreviewName");
  const hazardForm = document.getElementById("hazard-form");
  let currentPreviewUrl = null;

  function clearPhotoPreview() {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = null;
    }

    if (photoPreview) {
      photoPreview.removeAttribute("src");
    }
    if (photoPreviewName) {
      photoPreviewName.textContent = "";
    }
    if (photoPreviewWrap) {
      photoPreviewWrap.hidden = true;
    }
  }

  if (photoInput && photoPreview && photoPreviewWrap) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        clearPhotoPreview();
        return;
      }

      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      currentPreviewUrl = URL.createObjectURL(file);
      photoPreview.src = currentPreviewUrl;
      photoPreviewWrap.hidden = false;
      if (photoPreviewName) {
        photoPreviewName.textContent = file.name;
      }
    });
  }

  if (hazardForm) {
    hazardForm.addEventListener("reset", () => {
      window.setTimeout(clearPhotoPreview, 0);
    });
  }

  const mapEl = document.getElementById("map");
  if (mapEl && typeof L !== "undefined") {
    const map = L.map("map", {
      maxBoundsViscosity: 1.0,
      minZoom: 3,
      maxZoom: 19
    }).setView([20.5937, 78.9629], 5);

    const bounds = [
      [-90, -180],
      [90, 180]
    ];
    map.setMaxBounds(bounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true,
      bounds
    }).addTo(map);

    const hazardLayer = L.layerGroup().addTo(map);
    const socialRadarLayer = L.layerGroup().addTo(map);
    const socialRadarBtn = document.getElementById("social-radar-btn");
    const socialRadarStatus = document.getElementById("social-radar-status");

    function getHazardIcon(type) {
      const normalized = (type || "").toLowerCase();
      if (normalized.includes("flood") || normalized.includes("water")) return "🌊";
      if (normalized.includes("coast") || normalized.includes("wave")) return "💨";
      if (normalized.includes("cyclone") || normalized.includes("storm")) return "🌪️";
      if (normalized.includes("heat") || normalized.includes("fire")) return "🔥";
      if (normalized.includes("earthquake")) return "🌋";
      if (normalized.includes("collapse")) return "🏚️";
      if (normalized.includes("chemical") || normalized.includes("gas")) return "☣️";
      return "⚠️";
    }

    function setSocialRadarStatus(message, tone = "neutral") {
      if (!socialRadarStatus) return;
      socialRadarStatus.textContent = message || "";
      socialRadarStatus.hidden = !message;
      socialRadarStatus.dataset.tone = tone;
    }

    function createHazardIcon(type, severity) {
      const severityColor = severity === "high" ? "#ef4444" : severity === "medium" ? "#f59e0b" : "#10b981";
      const iconName = getHazardIcon(type);

      return L.divIcon({
        className: "custom-hazard-marker",
        html: `<div style="background-color: ${severityColor}; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); font-size: 16px;">${iconName}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    function createRadarIcon(hazardType) {
      return L.divIcon({
        className: "custom-radar-marker",
        html: `<div style="background-color: #0ea5e9; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 10px rgba(14,165,233,0.45); font-size: 16px;">${getHazardIcon(hazardType)}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
    }

    const hazardPanel = document.getElementById("hazard-panel");
    const closePanelBtn = document.getElementById("close-panel");
    const summarySection = document.getElementById("panel-summary-section");
    const summaryTextEl = document.getElementById("panel-summary-text");
    const summaryLanguageEl = document.getElementById("panel-summary-language");
    const summaryTabsWrap = document.getElementById("panel-summary-tabs");
    const summaryTabs = Array.from(document.querySelectorAll(".summary-tab"));
    let currentPanelSummary = null;

    if (closePanelBtn) {
      closePanelBtn.addEventListener("click", () => {
        if (hazardPanel) {
          hazardPanel.classList.add("collapsed");
        }
      });
    }

    function getSummaryText(summarySet, languageKey) {
      if (!summarySet) return "";
      if (languageKey === "english") return summarySet.english || "";
      if (languageKey === "hindi") return summarySet.hindi || "";
      return summarySet.original || "";
    }

    function updateSummaryPanel(languageKey) {
      if (!summarySection || !summaryTextEl || !summaryTabsWrap) return;

      const nextText = getSummaryText(currentPanelSummary, languageKey);
      if (!currentPanelSummary || !nextText) {
        summarySection.hidden = true;
        summaryTabsWrap.hidden = true;
        summaryTextEl.textContent = "";
        if (summaryLanguageEl) summaryLanguageEl.textContent = "";
        return;
      }

      summarySection.hidden = false;
      summaryTextEl.textContent = nextText;
      if (summaryLanguageEl) {
        summaryLanguageEl.textContent = currentPanelSummary.sourceLanguage
          ? `Source: ${formatLanguageName(currentPanelSummary.sourceLanguage)}`
          : "";
      }

      let visibleCount = 0;
      summaryTabs.forEach((tab) => {
        const targetLanguage = tab.dataset.summaryLang;
        const hasText = Boolean(getSummaryText(currentPanelSummary, targetLanguage));
        tab.hidden = !hasText;
        tab.classList.toggle("active", hasText && targetLanguage === languageKey);
        if (hasText) visibleCount += 1;
      });

      summaryTabsWrap.hidden = visibleCount <= 1;
    }

    summaryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        updateSummaryPanel(tab.dataset.summaryLang);
      });
    });

    function openHazardPanel(details) {
      if (!hazardPanel) return;

      document.getElementById("panel-type").textContent = details.type || details.title;
      document.getElementById("panel-icon").textContent = details.iconStr || getHazardIcon(details.type);
      document.getElementById("panel-location").textContent = details.title || "Unknown Location";
      document.getElementById("panel-raw-text").textContent =
        details.rawText || details.description || "No original report provided.";
      document.getElementById("panel-time").textContent = details.timeStr || new Date().toLocaleTimeString();

      const sevEl = document.getElementById("panel-severity");
      sevEl.textContent = details.severity || "medium";
      sevEl.className = `severity-badge severity-${(details.severity || "medium").toLowerCase()}`;

      const photoSection = document.getElementById("panel-photo-section");
      const photoEl = document.getElementById("panel-photo");
      if (photoSection && photoEl) {
        if (details.photoUrl) {
          photoEl.src = details.photoUrl;
          photoSection.hidden = false;
        } else {
          photoEl.removeAttribute("src");
          photoSection.hidden = true;
        }
      }

      currentPanelSummary = details.summary || null;
      updateSummaryPanel(
        details.summary && details.summary.original
          ? "original"
          : details.summary && details.summary.english
            ? "english"
            : "hindi"
      );

      hazardPanel.classList.remove("collapsed");
      if (typeof lucide !== "undefined") {
        lucide.createIcons();
      }

      map.flyTo(details.latlng, 12, { animate: true, duration: 1 });
    }

    async function scanSocialRadar(mode = "demo") {
      if (socialRadarBtn) {
        socialRadarBtn.disabled = true;
        socialRadarBtn.innerHTML = '<i data-lucide="loader-circle"></i> Scanning...';
        if (typeof lucide !== "undefined") {
          lucide.createIcons();
        }
      }

      setSocialRadarStatus("Scanning Jaipur social posts for possible emergencies...", "neutral");
      socialRadarLayer.clearLayers();

      try {
        const response = await fetch(`http://localhost:3000/api/scan-reddit?mode=${encodeURIComponent(mode)}`);
        const hazards = await response.json();

        if (!response.ok) {
          throw new Error(hazards?.error || "Social radar scan failed.");
        }

        if (!Array.isArray(hazards) || hazards.length === 0) {
          setSocialRadarStatus("No emergency posts were flagged by Social Radar this time.", "neutral");
          return;
        }

        let placedCount = 0;

        for (const hazard of hazards) {
          if (!hazard?.location_clues) {
            continue;
          }

          const fullAddress = `${hazard.location_clues}, Jaipur, Rajasthan, India`;
          let coords = null;

          try {
            coords = await geocodeAddress(fullAddress);
          } catch (error) {
            console.warn("Geocoding failed for Social Radar item:", hazard, error);
          }

          if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) {
            continue;
          }

          const marker = L.marker([coords.lat, coords.lng], {
            icon: createRadarIcon(hazard.hazard_type)
          });

          marker.bindTooltip(
            `<strong>Social Radar: ${hazard.hazard_type}</strong><br>${hazard.location_clues}<br><em>AI-detected from Reddit</em>`,
            {
              direction: "top",
              offset: [0, -10],
              opacity: 0.95
            }
          );

          marker.on("click", () => {
            openHazardPanel({
              type: `Social Radar: ${hazard.hazard_type}`,
              title: hazard.location_clues,
              description: hazard.description,
              severity: "medium",
              iconStr: getHazardIcon(hazard.hazard_type),
              latlng: [coords.lat, coords.lng],
              timeStr: "Detected just now",
              rawText: hazard.description,
              photoUrl: null,
              summary: null
            });
          });

          marker.addTo(socialRadarLayer);
          placedCount += 1;
        }

        if (placedCount === 0) {
          setSocialRadarStatus("Social Radar found possible hazards, but none could be placed on the map from the location clues.", "neutral");
          return;
        }

        setSocialRadarStatus(`Social Radar added ${placedCount} AI-detected hazard marker${placedCount === 1 ? "" : "s"} to the map.`, "success");
      } catch (error) {
        console.error("Social Radar scan failed:", error);
        setSocialRadarStatus("Social Radar scan failed. Make sure the backend is running and try again.", "error");
      } finally {
        if (socialRadarBtn) {
          socialRadarBtn.disabled = false;
          socialRadarBtn.innerHTML = '<i data-lucide="radio-tower"></i> Scan Social Radar';
          if (typeof lucide !== "undefined") {
            lucide.createIcons();
          }
        }
      }
    }

    if (socialRadarBtn) {
      socialRadarBtn.addEventListener("click", () => {
        scanSocialRadar("demo");
      });
    }

    try {
      onSnapshot(collection(db, "hazards"), (snapshot) => {
        hazardLayer.clearLayers();
        if (snapshot.empty) return;

        snapshot.forEach((doc) => {
          const d = doc.data();
          if (d.latitude == null || d.longitude == null) {
            return;
          }

          const reportedAt = d.timestamp && d.timestamp.toDate ? d.timestamp.toDate() : null;
          const marker = L.marker([d.latitude, d.longitude], {
            icon: createHazardIcon(d.type, d.severity)
          });

          marker.bindTooltip(
            `<strong>${d.type}</strong><br>${d.location}<br><em>${formatRelativeTime(reportedAt)}</em>`,
            {
              direction: "top",
              offset: [0, -10],
              opacity: 0.9
            }
          );

          marker.on("click", () => {
            openHazardPanel({
              type: d.type,
              title: d.location,
              description: d.rawText || d.description || "No additional details available.",
              severity: d.severity,
              iconStr: getHazardIcon(d.type),
              latlng: [d.latitude, d.longitude],
              timeStr: reportedAt ? reportedAt.toLocaleTimeString() : "Recently reported",
              rawText: d.rawText || null,
              photoUrl: d.photoUrl || null,
              summary: {
                original: d.summaryOriginal || d.aiSummaryOriginal || null,
                english: d.summaryEnglish || d.aiSummaryEnglish || null,
                hindi: d.summaryHindi || d.aiSummaryHindi || null,
                sourceLanguage: d.sourceLanguage || null
              }
            });
          });

          marker.addTo(hazardLayer);
        });
      });
    } catch (err) {
      console.warn("Firestore real-time listener failed:", err);
    }
  }

  const phoneForm = document.getElementById("phone-form");
  const otpForm = document.getElementById("otp-form");
  const resendBtn = document.getElementById("resend-btn");
  const stepPhone = document.getElementById("step-phone");
  const stepOtp = document.getElementById("step-otp");
  const otpHint = document.getElementById("otp-hint");

  if (phoneForm) {
    phoneForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const phone = document.getElementById("phone").value.trim();
      const phoneRegex = /^[0-9]{10}$/;

      if (phone && phoneRegex.test(phone)) {
        if (otpHint) otpHint.textContent = `A 6-digit code was sent to ${phone}`;
        stepPhone.style.display = "none";
        stepOtp.style.display = "block";
        document.getElementById("otp").focus();
      } else {
        alert("Please enter a valid 10-digit phone number.");
        document.getElementById("phone").style.borderColor = "#ef4444";
      }
    });
  }

  if (otpForm) {
    otpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const otp = document.getElementById("otp").value.trim();
      if (otp.length === 6) {
        localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
        window.location.href = "hazard.html";
      } else {
        document.getElementById("otp").style.borderColor = "#ef4444";
      }
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener("click", () => {
      document.getElementById("otp").value = "";
      document.getElementById("otp").style.borderColor = "";
      stepOtp.style.display = "none";
      stepPhone.style.display = "block";
    });
  }

  if (window.location.pathname.includes("hazard.html")) {
    if (!isVerifiedReporter()) {
      window.location.href = "login.html";
    }
  }
});
