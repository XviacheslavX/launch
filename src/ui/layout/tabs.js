import { initServersTab } from "../tabs/servers.js";
import { initSettingsTab } from "../tabs/settings.js";

const initializedTabs = new Set();

export function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  async function activateTab(tabName) {
    tabButtons.forEach(btn =>
      btn.classList.toggle("active", btn.dataset.tab === tabName)
    );

    tabContents.forEach(section =>
      section.classList.toggle(
        "active",
        section.id === `tab-${tabName}`
      )
    );

    // 🔥 LAZY INIT
    if (!initializedTabs.has(tabName)) {
      initializedTabs.add(tabName);

      if (tabName === "servers") {
        await initServersTab();
      }

      if (tabName === "settings") {
        await initSettingsTab();
      }
    }
  }

  tabButtons.forEach(btn =>
    btn.addEventListener("click", () =>
      activateTab(btn.dataset.tab)
    )
  );

  // стартова вкладка
  activateTab("servers");
}
