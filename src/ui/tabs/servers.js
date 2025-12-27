import { i18n } from "../../services/i18nService.js";

export async function initServersTab() {

  /* =============================
     LAUNCH OVERLAY
  ============================= */
  const launchOverlay = document.getElementById("launch-overlay");
  const launchBar = document.getElementById("launch-progress-bar");
  const launchPercent = document.getElementById("launch-percent");
  const launchStatus = document.getElementById("launch-status");
  const launchTitle = document.getElementById("launch-title");

  function showLaunchScreen(serverName) {
    launchTitle.textContent = serverName;
    launchBar.style.width = "0%";
    launchPercent.textContent = "0%";
    launchStatus.textContent = "Підготовка гри…";
    launchOverlay.classList.remove("hidden");
  }

  function updateLaunchProgress(percent, text) {
    launchBar.style.width = `${percent}%`;
    launchPercent.textContent = `${percent}%`;
    if (text) launchStatus.textContent = text;
  }

  function hideLaunchScreen() {
    launchOverlay.classList.add("hidden");
  }

  /* =============================
     SERVER UI
  ============================= */
  const listView = document.getElementById("server-list-view");
  const detailsView = document.getElementById("server-details-view");

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

    serverTitle.textContent = server.name;
    serverDescription.textContent = server.description || "";

    featuresList.innerHTML = "";
    (server.features || []).forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      featuresList.appendChild(li);
    });

    listView.style.display = "none";
    detailsView.style.display = "block";
  }

  /* =============================
     LOAD SERVERS
  ============================= */
  async function loadServers() {
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

  /* =============================
     BACK
  ============================= */
  backBtn.addEventListener("click", showList);

  /* =============================
     PROGRESS (FILES)
  ============================= */
  window.api.onDownloadProgress(p => {
    progress.value = p;
    downloadStatus.textContent = `Підготовка: ${p}%`;
    updateLaunchProgress(p, "Завантаження файлів…");
  });

  /* =============================
     PLAY
  ============================= */
  playBtn.addEventListener("click", async () => {
    if (!currentServer) return;

    const user = await window.api.getUser();
    if (!user) return alert("Увійдіть в акаунт");

    showLaunchScreen(currentServer.name);

    updateLaunchProgress(5, "Підготовка сервера…");
    await window.api.prepareServer(currentServer);

    updateLaunchProgress(90, "Запуск гри…");
    await window.api.launchGame(currentServer, user);

    updateLaunchProgress(100, "Готово");
    // hideLaunchScreen(); // не потрібно, бо лаунчер ховається
  });

  await loadServers();
    showList();
    
    // 🔁 коли гра закрилась — ховаємо overlay
    window.api.onGameClosed(() => {
    hideLaunchScreen();
    });
    
}
