(function () {
  const PLUGIN_ID = "stash-setrefresh";
  console.log("[stash-setrefresh] loaded");

  const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/";

  function callGQL(query, variables = {}) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${baseURL}graphql`, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.errors) {
            console.error("[stash-setrefresh] GraphQL errors", json.errors);
            resolve(null);
          } else {
            resolve(json.data);
          }
        } catch (e) {
          console.error("[stash-setrefresh] GraphQL parse error", e);
          resolve(null);
        }
      };
      xhr.onerror = () => {
        console.error("[stash-setrefresh] GraphQL network error");
        resolve(null);
      };
      xhr.send(JSON.stringify({ query, variables }));
    });
  }

  async function getSettings() {
    const data = await callGQL(`query { configuration { plugins } }`);
    return data?.configuration?.plugins?.[PLUGIN_ID] ?? {};
  }

  function isLowFps(rate) {
    if (!rate) return false;
    return Math.abs(rate - 25) < 1.5 || Math.abs(rate - 50) < 1.5;
  }

  async function getSceneFrameRate(sceneId) {
    const data = await callGQL(`
      query FindScene($id: ID!) {
        findScene(id: $id) {
          files { ... on VideoFile { frame_rate } }
        }
      }
    `, { id: sceneId });
    return data?.findScene?.files?.[0]?.frame_rate ?? null;
  }

  function setRefresh(rate, settings) {
    if (!settings.endpoint || !settings.output || !settings.resolution) {
      console.warn("[stash-setrefresh] missing settings");
      return;
    }

    const url = new URL(settings.endpoint);
    url.searchParams.set("output", settings.output);
    url.searchParams.set("resolution", settings.resolution);
    url.searchParams.set("rate", rate);
    url.searchParams.set("scale", settings.uiScale ?? 1);

    console.log("[stash-setrefresh] XHR to", url.toString());

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url.toString(), true);
    xhr.onload = () => console.log("[stash-setrefresh] XHR status", xhr.status);
    xhr.onerror = () => console.error("[stash-setrefresh] XHR failed");
    xhr.send();
  }

  function addButtons(container, settings) {
    if (!container || container.querySelector(".stash-setrefresh-btn")) return;

    const low = settings.lowRate ?? 50;
    const normal = settings.normalRate ?? 120;

    const makeBtn = (label, rate) => {
      const btn = document.createElement("button");
      btn.className = "stash-setrefresh-btn btn btn-secondary btn-sm";
      btn.textContent = label;
      btn.title = "Sets refresh rate, resolution, and UI scale as specified in Plugin Settings.";
      btn.onclick = () => setRefresh(rate, settings);
      return btn;
    };

    container.appendChild(makeBtn(`🇪🇺 ${low}`, low));
    container.appendChild(makeBtn(`🇺🇸 ${normal}`, normal));
    console.log("[stash-setrefresh] buttons added");
  }

  async function tryInject() {
    const match = location.pathname.match(/\/scenes\/(\d+)/);
    if (!match) return;

    const settings = await getSettings();
    if (!settings.endpoint || !settings.output || !settings.resolution) {
      console.log("[stash-setrefresh] incomplete settings", settings);
      return;
    }

    const fps = await getSceneFrameRate(match[1]);
    if (!isLowFps(fps)) return;

    const targets = [
      document.querySelector(".scene-player-controls"),
      document.querySelector(".scene-toolbar"),
      document.querySelector(".scene-header"),
      document.querySelector(".scene-tabs"),
    ].filter(Boolean);

    if (targets.length) addButtons(targets[0], settings);
  }

  function schedule() {
    if (!location.pathname.includes("/scenes/")) return;
    [400, 1000, 2000].forEach(d => setTimeout(tryInject, d));
  }

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  setInterval(() => {
    if (location.pathname.includes("/scenes/")) schedule();
  }, 1500);

  schedule();
})();
  scheduleInject();
})();
