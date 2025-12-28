// src/renderer.js
import { initI18n } from "./ui/layout/i18n.js";
import { initTabs } from "./ui/layout/tabs.js";

import { initAuthScreen } from "./ui/screens/authScreen.js";
import { initServersTab } from "./ui/tabs/servers.js";
import { initSettingsTab } from "./ui/tabs/settings.js";

import { loadHTML } from "./ui/loader.js";

/* =============================
   UI STATE HELPERS
============================= */
let appInitialized = false;

function showAuthScreen() {
  const authScreen = document.getElementById("auth-screen");
  const appShell = document.getElementById("app-shell");

  authScreen.classList.remove("hidden");
  appShell.classList.add("hidden");

  document.getElementById("user-block")?.classList.add("hidden");
}

async function showAppShell(user) {
  const authScreen = document.getElementById("auth-screen");
  const appShell = document.getElementById("app-shell");
  const authStatus = document.getElementById("auth-status");

  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  document.getElementById("user-block")?.classList.remove("hidden");
  authStatus.textContent = `✔ ${user.username}`;

  if (!appInitialized) {
    initTabs();
    appInitialized = true;
  }
}

/* =============================
   APP BOOTSTRAP
============================= */
document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("root");

  /* -------- LOAD HTML -------- */
  await loadHTML(root, "./layout/topbar.html");
  await loadHTML(root, "./screens/auth.html");
  await loadHTML(root, "./screens/app.html");

  await loadHTML(
    document.getElementById("sidebar"),
    "./layout/sidebar.html"
  );

  await loadHTML(
    document.getElementById("tab-servers"),
    "./tabs/servers.html"
  );

  await loadHTML(
    document.getElementById("tab-settings"),
    "./tabs/settings.html"
  );

  await loadHTML(root, "./layout/launchOverlay.html");


  /* -------- WINDOW CONTROLS -------- */
  document.getElementById("win-min")?.addEventListener("click", () => {
    window.api.windowControl.minimize();
  });

  document.getElementById("win-max")?.addEventListener("click", () => {
    window.api.windowControl.maximize();
  });

  document.getElementById("win-close")?.addEventListener("click", () => {
    window.api.windowControl.close();
  });

  /* -------- LOGOUT -------- */
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await window.api.logout();
    showAuthScreen();
  });

  /* -------- I18N -------- */
  await initI18n();

  /* -------- AUTH STATE -------- */
  const user = await window.api.getUser();

  if (user) {
    await showAppShell(user);
  } else {
    showAuthScreen();
  }

  /* -------- AUTH SCREEN INIT -------- */
  initAuthScreen(async user => {
    await showAppShell(user);
  });
});
