// firebase.js - Hazard form submission, image upload, and client-side Gemini summary generation
import { db } from "./firebase-core.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const imgbbApiKey = "9d23bff63185b7f0510ec68c8ee13b54";
const summaryApiEndpoint = "http://localhost:3000/api/generate-summary";

const hazardForm = document.getElementById("hazard-form");
const submitBtn = document.getElementById("submit-btn");
const formStatus = document.getElementById("form-status");
const generateAiBtn = document.getElementById("generateAiBtn");
const summaryPreviewContainer = document.getElementById("summaryPreviewContainer");
const summaryText = document.getElementById("summaryText");
const approveSummaryBtn = document.getElementById("approveSummaryBtn");
const discardSummaryBtn = document.getElementById("discardSummaryBtn");
const aiSummaryStatus = document.getElementById("aiSummaryStatus");
const rawTextInput = document.getElementById("h-desc");

window.currentAiSummaries = null;
window.aiSummaryApproved = false;
window.aiSummarySourceText = "";

function setAiStatus(message, tone = "neutral") {
  if (!aiSummaryStatus) return;

  aiSummaryStatus.textContent = message;
  aiSummaryStatus.className = `ai-summary-status ${tone}`;
  aiSummaryStatus.hidden = !message;
}

function clearAiSummaryState() {
  window.currentAiSummaries = null;
  window.aiSummaryApproved = false;
  window.aiSummarySourceText = "";

  if (summaryPreviewContainer) {
    summaryPreviewContainer.hidden = true;
  }

  if (summaryText) {
    summaryText.textContent = "";
  }
}

function renderAiSummaryPreview(summaryObject) {
  if (!summaryPreviewContainer || !summaryText) return;

  summaryPreviewContainer.hidden = false;
  summaryText.textContent = summaryObject.summaryOriginal || "";
}

function setGenerateButtonLoading(isLoading) {
  if (!generateAiBtn) return;

  generateAiBtn.disabled = isLoading;
  generateAiBtn.textContent = isLoading ? "\u23F3 Generating..." : "Generate AI Summary";
}

async function fetchGeminiSummary(rawText) {
  const response = await fetch(summaryApiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ rawText })
  });

  const result = await response.json();
  if (!response.ok) {
    const message = result?.error || "The backend could not generate a summary.";
    throw new Error(message);
  }

  if (!result?.summaryOriginal || !result?.summaryEnglish || !result?.summaryHindi) {
    throw new Error("The backend returned an incomplete summary response.");
  }

  return result;
}

async function compressImage(file, options = {}) {
  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 1600;
  const quality = options.quality || 0.75;
  const outputType = options.outputType || "image/jpeg";

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the selected image."));
    img.src = dataUrl;
  });

  let { width, height } = image;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not supported in this browser.");
  }

  context.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not compress the selected image."));
        return;
      }

      const fileExtension = outputType === "image/png" ? "png" : "jpg";
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      resolve(new File([blob], `${baseName}-compressed.${fileExtension}`, { type: outputType }));
    }, outputType, quality);
  });
}

if (generateAiBtn && rawTextInput) {
  generateAiBtn.addEventListener("click", async (event) => {
    event.preventDefault();

    const rawText = rawTextInput.value.trim();
    if (!rawText) {
      setAiStatus("Write the hazard report first, then generate the AI summary.", "error");
      return;
    }

    setGenerateButtonLoading(true);
    setAiStatus("Generating the bilingual AI summary preview...", "neutral");

    try {
      const summaries = await fetchGeminiSummary(rawText);
      window.currentAiSummaries = summaries;
      window.aiSummaryApproved = false;
      window.aiSummarySourceText = rawText;
      renderAiSummaryPreview(summaries);
      setAiStatus("Preview ready. Click Looks Good to save this summary with the report.", "success");
    } catch (error) {
      console.error("Gemini summary generation failed:", error);
      clearAiSummaryState();
      setAiStatus("AI summary generation failed. You can still submit the original report.", "error");
    } finally {
      setGenerateButtonLoading(false);
    }
  });

  rawTextInput.addEventListener("input", () => {
    const nextValue = rawTextInput.value.trim();
    if (window.currentAiSummaries && nextValue !== window.aiSummarySourceText) {
      clearAiSummaryState();
      setAiStatus("The report changed, so the previous AI summary was cleared. Generate it again if you want to use it.", "neutral");
    }
  });
}

if (approveSummaryBtn) {
  approveSummaryBtn.addEventListener("click", () => {
    if (!window.currentAiSummaries) {
      setAiStatus("Generate a summary first before approving it.", "error");
      return;
    }

    window.aiSummaryApproved = true;
    setAiStatus("AI summary approved. It will be saved with this report.", "success");
  });
}

if (discardSummaryBtn) {
  discardSummaryBtn.addEventListener("click", () => {
    clearAiSummaryState();
    setAiStatus("AI summary discarded. Only the original report will be submitted.", "neutral");
  });
}

if (hazardForm) {
  hazardForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearAiSummaryState();
      setAiStatus("");
    }, 0);
  });

  hazardForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("h-type").value;
    const location = document.getElementById("h-location").value.trim();
    const latitude = parseFloat(document.getElementById("h-lat").value) || null;
    const longitude = parseFloat(document.getElementById("h-lng").value) || null;
    const severity = document.querySelector('input[name="severity"]:checked')?.value || "low";
    const rawText = document.getElementById("h-desc").value.trim();
    const photoInputElement = document.getElementById("photoInput");
    const imageFile = photoInputElement?.files?.[0] || null;

    if (!type || !location || !rawText) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    formStatus.style.display = "none";

    let finalPhotoUrl = null;
    const approvedSummaries =
      window.currentAiSummaries &&
      window.aiSummaryApproved === true &&
      window.aiSummarySourceText === rawText
        ? window.currentAiSummaries
        : null;

    try {
      if (imageFile) {
        const compressedImageFile = await compressImage(imageFile, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.65,
          outputType: "image/jpeg"
        });

        const formData = new FormData();
        formData.append("image", compressedImageFile);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (!response.ok || !result?.success || !result?.data?.display_url) {
          throw new Error(result?.error?.message || "Image upload failed.");
        }

        finalPhotoUrl = result.data.display_url;
      }

      await addDoc(collection(db, "hazards"), {
        type,
        location,
        latitude,
        longitude,
        severity,
        rawText,
        summaryOriginal: approvedSummaries?.summaryOriginal || null,
        summaryEnglish: approvedSummaries?.summaryEnglish || null,
        summaryHindi: approvedSummaries?.summaryHindi || null,
        sourceLanguage: approvedSummaries?.sourceLanguage || null,
        photoUrl: finalPhotoUrl,
        timestamp: serverTimestamp()
      });

      formStatus.textContent = approvedSummaries
        ? "Report submitted with the approved AI summary."
        : "Report submitted without an AI summary.";
      formStatus.className = "form-status success";
      formStatus.style.display = "block";
      hazardForm.reset();
    } catch (err) {
      console.error("Submission error:", err);
      formStatus.textContent = "Something went wrong. Please try again.";
      formStatus.className = "form-status error";
      formStatus.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Report";
    }
  });
}
