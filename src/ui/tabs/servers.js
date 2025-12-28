import { i18n } from "../../services/i18nService.js";

export async function initServersTab() {
  /* =============================
     ROOT CHECK
  ============================= */
  const listView = document.getElementById("server-list-view");
  const detailsView = document.getElementById("server-details-view");

  if (!listView || !detailsView) {
    console.warn("[ServersTab] HTML not loaded, skipping init");
    return;
  }

  /* =============================
     LAUNCH OVERLAY
  ============================= */
  const launchOverlay = document.getElementById("launch-overlay");
  const launchBar = document.getElementById("launch-progress-bar");
  const launchPercent = document.getElementById("launch-percent");
  const launchStatus = document.getElementById("launch-status");
  const launchTitle = document.getElementById("launch-title");

  function showLaunchScreen(serverName) {
    if (!launchOverlay) return;

    if (launchTitle) launchTitle.textContent = serverName;
    if (launchBar) launchBar.style.width = "0%";
    if (launchPercent) launchPercent.textContent = "0%";
    if (launchStatus) launchStatus.textContent = "Підготовка гри…";

    launchOverlay.classList.remove("hidden");
  }

  function updateLaunchProgress(percent, text) {
    if (launchBar) launchBar.style.width = `${percent}%`;
    if (launchPercent) launchPercent.textContent = `${percent}%`;
    if (text && launchStatus) launchStatus.textContent = text;
  }

  function hideLaunchScreen() {
    launchOverlay?.classList.add("hidden");
  }

  /* =============================
     SERVER UI ELEMENTS
  ============================= */
  const list = document.getElementById("server-list");
  const playBtn = document.getElementById("play-btn");
  const backBtn = document.getElementById("server-back-btn");

  const serverTitle = document.getElementById("server-title");
  const serverDescription = document.getElementById("server-description");
  const featuresList = document.getElementById("server-features");

  const progress = document.getElementById("download-progress");
  const downloadStatus = document.getElementById("download-status");

  let currentServer = null;

  /* =============================
     VIEW SWITCH
  ============================= */
  function showList() {
    listView.style.display = "block";
    detailsView.style.display = "none";
  }

  function showDetails(server) {
    currentServer = server;

    if (serverTitle) serverTitle.textContent = server.name;
    if (serverDescription) {
      serverDescription.textContent = server.description || "";
    }

    if (featuresList) {
      know: featuresList.innerHTML = "";
      (server.features || []).forEach(f => {
        const li = document.createElement("li");
        li.textContent = f;
        featuresList.appendChild(li);
      });
    }

    listView.style.display = "none";
    detailsView.style.display = "block";
  }

  /* =============================
     EVENTS
  ============================= */
  if (backBtn) {
    backBtn.addEventListener("click", showList);
  }

  if (playBtn) {
    playBtn.addEventListener("click", async () => {
      if (!currentServer) return;

      const user = await window.api.getUser();
      if (!user) {
        alert("Увійдіть в акаунт");
        return;
      }

      showLaunchScreen(currentServer.name);

      updateLaunchProgress(5, "Підготовка сервера…");
      await window.api.prepareServer(currentServer);

      updateLaunchProgress(90, "Запуск гри…");
      await window.api.launchGame(currentServer, user);

      updateLaunchProgress(100, "Готово");
    });
  }

  window.api.onDownloadProgress(p => {
    if (progress) progress.value = p;
    if (downloadStatus) {
      downloadStatus.textContent = `Підготовка: ${p}%`;
    }
    updateLaunchProgress(p, "Завантаження файлів…");
  });

  window.api.onGameClosed(() => {
    hideLaunchScreen();
  });

  /* =============================
     LOAD SERVERS
  ============================= */
  async function loadServers() {
    if (!list) return;

    const servers = await window.api.getServers();
    list.innerHTML = "";

    servers.forEach(server => {
      const li = document.createElement("li");
      li.className = "server-item";

      li.innerHTML = `
        <strong>${server.name}</strong>
        <div class="server-meta">
          Minecraft ${server.version} • ${server.type}
        </div>
      `;

      li.addEventListener("click", () => {
        window.api.selectServer(server);
        showDetails(server);
      });

      list.appendChild(li);
    });
  }

  await loadServers();
  showList();
}
