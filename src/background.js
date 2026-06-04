import browser from "webextension-polyfill";

const STORAGE_KEY = "ocrSettings";
const DEFAULT_SETTINGS = Object.freeze({
  endpointUrl: "http://127.0.0.1:21600/api/ocr"
});
const REQUEST_TIMEOUT_MS = 8000;

function normalizeEndpointUrl(value, strict = false) {
  const rawValue = typeof value === "string" ? value.trim() : "";
  const candidate = rawValue || DEFAULT_SETTINGS.endpointUrl;

  let endpointUrl;
  try {
    endpointUrl = new URL(candidate);
  } catch (error) {
    if (strict) {
      throw new Error("OCR 服务地址不是合法 URL。");
    }
    return DEFAULT_SETTINGS.endpointUrl;
  }

  if (endpointUrl.protocol !== "http:" && endpointUrl.protocol !== "https:") {
    if (strict) {
      throw new Error("OCR 服务地址只支持 http 或 https。");
    }
    return DEFAULT_SETTINGS.endpointUrl;
  }

  if (endpointUrl.pathname === "" || endpointUrl.pathname === "/") {
    endpointUrl.pathname = "/api/ocr";
  }

  return endpointUrl.toString();
}

function normalizeSettings(rawSettings, strict = false) {
  return {
    endpointUrl: normalizeEndpointUrl(rawSettings?.endpointUrl, strict)
  };
}

async function getSettings() {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return normalizeSettings(stored[STORAGE_KEY]);
}

async function saveSettings(nextSettings) {
  const normalized = normalizeSettings(nextSettings, true);
  await browser.storage.local.set({
    [STORAGE_KEY]: normalized
  });
  return normalized;
}

function extractCaptchaText(payload) {
  const candidates = [
    payload?.result,
    payload?.text,
    payload?.code,
    payload?.captcha,
    payload?.prediction,
    payload?.value,
    payload?.data?.result,
    payload?.data?.text,
    payload?.data?.code
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (typeof payload?.expression === "string" && payload.expression.includes("=")) {
    const tail = payload.expression.split("=").at(-1)?.trim();
    if (tail) {
      return tail;
    }
  }

  return "";
}

async function postImageToOcr(payload) {
  const settings = await getSettings();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const rawDataUrl = typeof payload.dataUrl === "string" ? payload.dataUrl.trim() : "";
    if (!rawDataUrl.startsWith("data:")) {
      return {
        ok: false,
        error: "页面没有提供可用的验证码图片数据。",
        status: 0
      };
    }

    const base64Payload = rawDataUrl.includes(",")
      ? rawDataUrl.slice(rawDataUrl.indexOf(",") + 1)
      : "";
    if (!base64Payload) {
      return {
        ok: false,
        error: "验证码图片 data URL 缺少 base64 数据。",
        status: 0
      };
    }

    const endpointUrl = new URL(settings.endpointUrl);
    if (endpointUrl.pathname.endsWith("/api/ocr/upload")) {
      endpointUrl.pathname = endpointUrl.pathname.replace(/\/api\/ocr\/upload$/, "/api/ocr");
    }

    const response = await fetch(endpointUrl.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        imageBase64: base64Payload
      }),
      cache: "no-store",
      signal: controller.signal
    });

    const responseText = await response.text();
    let responseBody = null;
    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      responseBody = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        error: responseBody?.error || `OCR 服务返回 HTTP ${response.status}。`,
        status: response.status,
        responseBody
      };
    }

    const text = extractCaptchaText(responseBody);
    if (!text) {
      return {
        ok: false,
        error: responseBody?.error || "OCR 服务没有返回可填写的识别结果。",
        status: response.status,
        responseBody
      };
    }

    if (responseBody?.success === false) {
      return {
        ok: false,
        error: responseBody.error || "OCR 服务返回失败。",
        status: response.status,
        responseBody
      };
    }

    return {
      ok: true,
      text,
      expression: typeof responseBody?.expression === "string"
        ? responseBody.expression.trim()
        : "",
      status: response.status,
      responseBody,
      endpointUrl: endpointUrl.toString()
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: error instanceof DOMException && error.name === "AbortError"
        ? "OCR 请求超时。"
        : `OCR 请求失败：${message}`,
      status: 0
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

browser.runtime.onInstalled.addListener(async () => {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  if (!stored[STORAGE_KEY]) {
    await browser.storage.local.set({
      [STORAGE_KEY]: DEFAULT_SETTINGS
    });
    return;
  }

  const normalized = normalizeSettings(stored[STORAGE_KEY]);
  await browser.storage.local.set({
    [STORAGE_KEY]: normalized
  });
});

browser.runtime.onMessage.addListener((message) => {
  if (!message?.type) {
    return undefined;
  }

  if (message.type === "GET_SETTINGS") {
    return getSettings();
  }

  if (message.type === "SAVE_SETTINGS") {
    return saveSettings(message.payload || {});
  }

  if (message.type === "OCR_RECOGNIZE") {
    return postImageToOcr(message.payload || {});
  }

  return undefined;
});
