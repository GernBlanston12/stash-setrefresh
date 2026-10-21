(function () {
  const PLUGIN_ID = "stash-setrefresh";

  const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

  async function callGQL(query, variables = {}) {
    try {
      const res = await fetch(`${baseURL}graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const json = await res.json();
      if (json.errors) return null;
      return json.data;
    } catch (e) {
      return null;
    }
  }

  async function getSettings() {
    const query = `query { configuration { plugins } }`;
    const data = await callGQL(query);
    return data?.configuration?.plugins?.[PLUGIN_ID] ?? {};
  }

  function isLowFps(rate) {
    if (!rate) return false;
    return Math.abs(rate - 25) < 1.5 || Math.abs(rate - 50) < 1.5;
  }

  async function getSceneFrameRate(sceneId) {
    const query = `
      query FindScene($id: ID!) {
        findScene(id: $id) {
          files {
            ... on VideoFile {
              frame_rate
            }
          }
        }
      }
    `;
    const data = await callGQL(query, { id: sceneId });
    return data?.findScene?.files?.[0]?.frame_rate ?? null;
  }

  function setRefresh(rate, settings) {
    if (!settings.endpoint || !settings.output || !settings.resolution) return;

    const url = new URL(settings.endpoint);
    url.searchParams.set("output", settings.output);
    url.searchParams.set("resolution", settings.resolution);
    url.searchParams.set("rate", rate);
    url.searchParams.set("scale", settings.uiScale ?? 1);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url.toString(), true);
    xhr.send();
  }

  function addButtons(container, settings) {
    if (!container || container.querySelector(".stash-setrefresh-btn")) return;

    const low = settings.lowRate ?? 50;
    const normal = settings.normalRate ?? 120;

    const eu = document.createElement("button");
    eu.className = "stash-setrefresh-btn btn btn-secondary btn-sm";
    eu.textContent = `🇪🇺 ${low}`;
    eu.title = "Sets refresh rate, resolution, and UI scale as specified in Plugin Settings.";
    eu.onclick = () => setRefresh(low, settings);

    const us = document.createElement("button");
    us.className = "stash-setrefresh-btn btn btn-secondary btn-sm";
    us.textContent = `🇺🇸 ${normal}`;
    us.title = "Sets refresh rate, resolution, and UI scale as specified in Plugin Settings.";
    us.onclick = () => setRefresh(normal, settings);

    container.appendChild(eu);
    container.appendChild(us);
  }

  async function tryInject() {
    const match = location.pathname.match(/\/scenes\/(\d+)/);
    if (!match) return;

    const sceneId = match[1];
    const settings = await getSettings();
    if (!settings.endpoint || !settings.output || !settings.resolution) return;

    const fps = await getSceneFrameRate(sceneId);
    if (!isLowFps(fps)) return;

    const targets = [
      document.querySelector(".scene-player-controls"),
      document.querySelector(".scene-toolbar"),
      document.querySelector(".scene-header"),
      document.querySelector(".scene-tabs"),
    ].filter(Boolean);

    if (targets.length) addButtons(targets[0], settings);
  }

  // Aggressive retries on scene pages
  function scheduleInject() {
    if (!location.pathname.includes("/scenes/")) return;
    [300, 800, 1500, 2500].forEach(delay => setTimeout(tryInject, delay));
  }

  const observer = new MutationObserver(() => {
    if (location.pathname.includes("/scenes/")) scheduleInject();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Also watch for SPA navigation
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
      scheduleInject();
    }
  }, 500);

  scheduleInject();
})();
