// src/renderer.js
import { initI18n } from "./ui/layout/i18n.js";
import { initTabs } from "./ui/layout/tabs.js";

import { initAuthScreen } from "./ui/screens/authScreen.js";
import { initServersTab } from "./ui/tabs/servers.js";
import { initSettingsTab } from "./ui/tabs/settings.js";

const authScreen = document.getElementById("auth-screen");
const appShell = document.getElementById("app-shell");
const authStatus = document.getElementById("auth-status");
const logoutBtn = document.getElementById("logout-btn");

let appInitialized = false;

/* =============================
   UI STATE
============================= */
function showAuthScreen() {
  authScreen.classList.remove("hidden");
  appShell.classList.add("hidden");
}

async function showAppShell(user) {
  authScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  authStatus.textContent = `✔ ${user.username}`;

  // 🔒 ініціалізуємо app ТІЛЬКИ 1 раз
  if (!appInitialized) {
    initTabs();
    await initServersTab();
    await initSettingsTab();
    appInitialized = true;
  }
}

/* =============================
   LOGOUT
============================= */
logoutBtn.addEventListener("click", async () => {
  await window.api.logout();
  showAuthScreen();
});

/* =============================
   APP START
============================= */
document.addEventListener("DOMContentLoaded", async () => {
  await initI18n();

  const user = await window.api.getUser();

  if (user) {
    await showAppShell(user);
  } else {
    showAuthScreen();
  }

  // 🔐 auth screen init (з callback)
  initAuthScreen(async user => {
    await showAppShell(user);
  });
});
