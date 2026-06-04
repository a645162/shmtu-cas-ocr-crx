import browser from "webextension-polyfill";

const DEFAULT_ENDPOINT_URL = "http://127.0.0.1:21600/api/ocr";

const form = document.querySelector("#settings-form");
const endpointInput = document.querySelector("#endpoint-url");
const statusText = document.querySelector("#status-text");
const defaultButton = document.querySelector("#default-button");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#b42318" : "#0b67b0";
}

async function loadSettings() {
  try {
    const settings = await browser.runtime.sendMessage({
      type: "GET_SETTINGS"
    });
    endpointInput.value = settings?.endpointUrl || DEFAULT_ENDPOINT_URL;
    setStatus("当前配置已加载。");
  } catch (error) {
    endpointInput.value = DEFAULT_ENDPOINT_URL;
    setStatus("读取配置失败，已回退到默认值。", true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("保存中...");

  try {
    const saved = await browser.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: {
        endpointUrl: endpointInput.value
      }
    });

    endpointInput.value = saved.endpointUrl;
    setStatus("OCR 服务地址已保存。");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(message || "保存失败。", true);
  }
});

defaultButton.addEventListener("click", () => {
  endpointInput.value = DEFAULT_ENDPOINT_URL;
  setStatus("默认地址已填入，点击保存即可生效。");
});

void loadSettings();
