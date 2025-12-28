export async function initSettingsTab() {
  /* =============================
     ROOT CHECK
  ============================= */
  const slider = document.getElementById("memory-slider");
  const valueLabel = document.getElementById("memory-value");
  const cfgClose = document.getElementById("cfg-close-launcher");

  if (!slider) {
    console.warn("[SettingsTab] HTML not loaded, skipping init");
    return;
  }

  const gb = v => parseInt(v.replace("G", ""), 10);

  /* =============================
     LOAD CONFIG
  ============================= */
  async function load() {
    const cfg = await window.api.getConfig();
    const mem = await window.api.getSystemMemory();

    // --- MEMORY ---
    slider.min = 1;
    slider.max = mem.recommendedMax;

    const value = gb(cfg.memory.xmx);
    slider.value = value;

    if (valueLabel) {
      valueLabel.textContent = `${value} GB`;
    }

    // --- LAUNCHER ---
    if (cfgClose) {
      cfgClose.checked = !!cfg.closeLauncherOnStart;
    }
  }

  /* =============================
     MEMORY AUTOSAVE
  ============================= */
  slider.addEventListener("input", async () => {
    const value = parseInt(slider.value, 10);

    if (valueLabel) {
      valueLabel.textContent = `${value} GB`;
    }

    const cfg = await window.api.getConfig();

    await window.api.saveConfig({
      ...cfg,
      memory: {
        xms: `${value}G`,
        xmx: `${value}G`
      }
    });
  });

  /* =============================
     CLOSE LAUNCHER OPTION
  ============================= */
  if (cfgClose) {
    cfgClose.addEventListener("input", async () => {
      const cfg = await window.api.getConfig();

      await window.api.saveConfig({
        ...cfg,
        closeLauncherOnStart: cfgClose.checked
      });
    });
  }

  await load();
}
