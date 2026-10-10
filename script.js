const editableNodes = [...document.querySelectorAll("[data-editable]")];
const toast = document.querySelector("#toast");
const toastMessage = document.querySelector("#toastMessage");
const weddingAudio = document.querySelector("#weddingAudio");
const musicToggle = document.querySelector("#musicToggle");
const musicLabel = document.querySelector("#musicLabel");
const invitationVideo = document.querySelector("#invitationVideo");
const videoTrimTailSeconds = 2;
const siteHeader = document.querySelector(".site-header");
const scrollProgress = document.querySelector("#scrollProgress");
const heroImage = document.querySelector(".hero-image-wrap img, .hero-image-wrap video");
const heroPattern = document.querySelector(".hero-pattern");
const navLinks = [...document.querySelectorAll(".main-nav a")];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const storageKey = "our-day-wedding-invitation-v2";
let toastTimer;
let scrollFrame;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealNodes = [...document.querySelectorAll(".reveal")];
const depthNodes = [...document.querySelectorAll(".details-card, .story-photo, .event-card")];
const textRevealNodes = [...document.querySelectorAll([
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main .eyebrow",
  "main .section-kicker",
  "main .couple-names",
  "main .family-line",
  "main .hero-meta",
  "main .hero-caption",
  "main .story-photo-label",
  "main .ornament-label",
  "main .details-card-top",
  "main .card-script",
  "main .detail-row strong",
  "main .detail-label",
  "main .detail-sub",
  "main .event-number",
  "main .event-label",
  "main .event-main > p",
  "main .event-arrow",
  "main .button",
  "main .text-link",
  "main .signature",
  "main .signature-note",
  "main .hero-stamp",
  "main .ornament-star",
  ".site-header .brand",
  ".site-header .main-nav a",
  ".site-header .music-toggle",
  ".creator-credit-footer"
].join(", "))];

textRevealNodes.forEach((node, index) => {
  node.classList.add("text-reveal");
  node.style.setProperty("--text-delay", `${(index % 4) * 70}ms`);
});

function viewportHeight() {
  return window.visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
}

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3600);
}

function savedDetails() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function saveDetails() {
  const details = {};
  editableNodes.forEach((node) => {
    details[node.dataset.editable] = node.textContent.trim();
  });
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(details));
  } catch {
    // The invitation still works when storage is unavailable.
  }
}

function restoreDetails() {
  const details = savedDetails();
  editableNodes.forEach((node) => {
    if (details[node.dataset.editable]) node.textContent = details[node.dataset.editable];
  });
}

restoreDetails();
editableNodes.forEach((node) => node.addEventListener("input", saveDetails));

function updateMusicButton(isPlaying) {
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicLabel.textContent = isPlaying ? "Pause music" : "Play music";
}

musicToggle.addEventListener("click", async () => {
  if (weddingAudio.paused) {
    try {
      await weddingAudio.play();
    } catch {
      showToast("Tap Play music once more to start the invitation sound.");
    }
  } else {
    weddingAudio.pause();
  }
});
weddingAudio.addEventListener("play", () => updateMusicButton(true));
weddingAudio.addEventListener("pause", () => updateMusicButton(false));
weddingAudio.addEventListener("error", () => showToast("The invitation sound could not be loaded."));

function syncInvitationVideo() {
  if (!invitationVideo) return;
  invitationVideo.muted = true;
  invitationVideo.volume = 0;
  if (Number.isFinite(weddingAudio.currentTime) && Number.isFinite(invitationVideo.duration) && invitationVideo.duration > 0) {
    const usableDuration = Math.max(0.1, invitationVideo.duration - videoTrimTailSeconds);
    invitationVideo.currentTime = weddingAudio.currentTime % usableDuration;
  }
  invitationVideo.play().catch(() => {});
}

if (invitationVideo) {
  invitationVideo.muted = true;
  invitationVideo.volume = 0;
  const trimVideoTail = () => {
    if (!Number.isFinite(invitationVideo.duration) || invitationVideo.duration <= videoTrimTailSeconds) return;
    if (invitationVideo.currentTime >= invitationVideo.duration - videoTrimTailSeconds) {
      invitationVideo.currentTime = 0;
      invitationVideo.play().catch(() => {});
    }
  };
  invitationVideo.addEventListener("timeupdate", trimVideoTail);
  invitationVideo.play().catch(() => {});
  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) syncInvitationVideo();
        else invitationVideo.pause();
      });
    }, { threshold: 0.2 });
    videoObserver.observe(invitationVideo);
  }
  weddingAudio.addEventListener("play", syncInvitationVideo);
}

let autoPlayAttempted = false;
async function startWeddingMusic(fromUserGesture = false) {
  if ((!fromUserGesture && autoPlayAttempted) || !weddingAudio.paused) return;
  autoPlayAttempted = true;
  try {
    await weddingAudio.play();
    updateMusicButton(true);
  } catch {
    if (!fromUserGesture) showToast("Scroll once to start the invitation sound.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWeddingMusic, { once: true });
} else {
  startWeddingMusic();
}

// Browsers block audible autoplay until the visitor interacts with the page.
// Start automatically on the first scroll/touch so no music-button click is needed.
const startMusicFromFirstGesture = () => startWeddingMusic(true);
window.addEventListener("scroll", startMusicFromFirstGesture, { once: true, passive: true });
window.addEventListener("pointerdown", startMusicFromFirstGesture, { once: true, passive: true });

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.toggle("is-text-visible", entry.target.classList.contains("text-reveal"));
        entry.target.classList.toggle("is-visible", !entry.target.classList.contains("text-reveal"));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealNodes.forEach((node) => observer.observe(node));
  textRevealNodes.forEach((node) => observer.observe(node));
}

// Scroll fallback: this keeps the animation working even in browsers or
// embedded previews where IntersectionObserver is delayed or unavailable.
function revealElementsInView() {
  const triggerLine = viewportHeight() * 0.88;
  revealNodes.forEach((node) => {
    if (node.classList.contains("is-visible")) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < triggerLine && rect.bottom > -40) node.classList.add("is-visible");
  });
  textRevealNodes.forEach((node) => {
    if (node.classList.contains("is-text-visible")) return;
    const rect = node.getBoundingClientRect();
    if (rect.top < triggerLine && rect.bottom > -40) node.classList.add("is-text-visible");
  });
}

function updateDepthFocus() {
  const viewport = viewportHeight();
  depthNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewport * 0.52) / (viewport * 0.8);
    const focus = Math.max(0, Math.min(1, 1 - distance));
    node.style.setProperty("--focus-glow", focus.toFixed(3));
  });
}

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = pageHeight > 0 ? Math.min(scrollTop / pageHeight, 1) : 0;
  scrollProgress.style.width = `${progress * 100}%`;
  siteHeader.classList.toggle("is-scrolled", scrollTop > 20);
  revealElementsInView();
  updateDepthFocus();

  if (!prefersReducedMotion) {
    const parallaxY = Math.min(scrollTop * 0.08, 42);
    heroImage.style.transform = `translate3d(0, ${parallaxY}px, 0) scale(1.02)`;
    heroPattern.style.transform = `translate3d(0, ${Math.min(scrollTop * 0.035, 18)}px, 0)`;
  }

}

function requestScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateScrollEffects();
    scrollFrame = undefined;
  });
}

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
window.visualViewport?.addEventListener("resize", requestScrollUpdate, { passive: true });
updateScrollEffects();

if ("IntersectionObserver" in window) {
  const activeSectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
    });
  }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
  navSections.forEach((section) => activeSectionObserver.observe(section));
}


