import browser from "webextension-polyfill";

const PAGE_PREFIX = "https://cas.shmtu.edu.cn/cas/login";
const CAPTCHA_SELECTOR = "#captchaImg";
const INPUT_SELECTOR = "#validateCode";
const RETRY_BUTTON_ID = "shmtu-cas-ocr-retry-button";
const STATUS_ID = "shmtu-cas-ocr-status";
const EXPRESSION_ID = "shmtu-cas-ocr-expression";
const INFO_ROW_ID = "shmtu-cas-ocr-info-row";
const PREVIEW_IMG_ID = "shmtu-cas-ocr-preview-image";
const PAYLOAD_META_ID = "shmtu-cas-ocr-payload-meta";
const PAYLOAD_TEXT_ID = "shmtu-cas-ocr-payload-text";

let recognitionTimer = null;
let activeRunId = 0;
let observedCaptcha = null;
let captchaAttributeObserver = null;

function getRetryButton() {
  return document.getElementById(RETRY_BUTTON_ID);
}

function getStatusNode() {
  return document.getElementById(STATUS_ID);
}

function getExpressionNode() {
  return document.getElementById(EXPRESSION_ID);
}

function getInfoRow() {
  return document.getElementById(INFO_ROW_ID);
}

function getPreviewImageNode() {
  return document.getElementById(PREVIEW_IMG_ID);
}

function getPayloadMetaNode() {
  return document.getElementById(PAYLOAD_META_ID);
}

function getPayloadTextNode() {
  return document.getElementById(PAYLOAD_TEXT_ID);
}

function isTargetPage() {
  return window.location.href.startsWith(PAGE_PREFIX);
}

function getCaptchaImage() {
  return document.querySelector(CAPTCHA_SELECTOR);
}

function getValidateCodeInput() {
  return document.querySelector(INPUT_SELECTOR);
}

function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setStatus(message, tone = "info") {
  const statusNode = getStatusNode();
  if (!statusNode) {
    return;
  }

  statusNode.textContent = message;
  if (tone === "error") {
    statusNode.style.color = "#b42318";
    return;
  }

  if (tone === "success") {
    statusNode.style.color = "#0b67b0";
    return;
  }

  statusNode.style.color = "#475569";
}

function setRetryButtonBusy(isBusy) {
  const retryButton = getRetryButton();
  if (!retryButton) {
    return;
  }

  retryButton.disabled = isBusy;
  retryButton.textContent = isBusy ? "识别中..." : "重新 OCR";
}

function setExpression(expression) {
  const expressionNode = getExpressionNode();
  if (!expressionNode) {
    return;
  }

  if (!expression) {
    expressionNode.textContent = "OCR算式：等待识别";
    return;
  }

  expressionNode.textContent = `OCR算式：${expression}`;
}

function setPayloadPreview(dataUrl, endpointUrl = "") {
  const previewImageNode = getPreviewImageNode();
  const payloadMetaNode = getPayloadMetaNode();
  const payloadTextNode = getPayloadTextNode();
  if (!previewImageNode || !payloadMetaNode || !payloadTextNode) {
    return;
  }

  if (!dataUrl) {
    previewImageNode.removeAttribute("src");
    previewImageNode.style.display = "none";
    payloadMetaNode.textContent = "发送数据：等待识别";
    payloadTextNode.value = "";
    return;
  }

  previewImageNode.src = dataUrl;
  previewImageNode.style.display = "block";

  const commaIndex = dataUrl.indexOf(",");
  const header = commaIndex >= 0 ? dataUrl.slice(0, commaIndex) : "data:";
  const base64Payload = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : "";
  const sizeHint = Math.floor((base64Payload.length * 3) / 4);
  payloadMetaNode.textContent =
    `发送目标：${endpointUrl || "等待返回"} | 数据头：${header} | 估算字节：${sizeHint}`;
  payloadTextNode.value = dataUrl;
}

function scheduleRecognition(reason, delayMs = 300) {
  if (recognitionTimer !== null) {
    window.clearTimeout(recognitionTimer);
  }

  recognitionTimer = window.setTimeout(() => {
    recognitionTimer = null;
    void recognizeCaptcha(reason);
  }, delayMs);
}

function captchaToDataUrl(image) {
  if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
    throw new Error("当前验证码图片尚未加载完成。");
  }

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("浏览器无法创建验证码绘图上下文。");
  }

  // 直接读取页面上当前显示的验证码像素，避免重新请求导致验证码变化。
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/png");
  if (!dataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("当前验证码图片转换 data URL 失败。");
  }

  return dataUrl;
}

async function recognizeCaptcha(reason) {
  if (!isTargetPage()) {
    return;
  }

  const image = getCaptchaImage();
  const input = getValidateCodeInput();
  if (!image || !input) {
    return;
  }

  if (!image.complete || image.naturalWidth === 0) {
    return;
  }

  const runId = ++activeRunId;

  try {
    setRetryButtonBusy(true);
    setStatus("正在识别验证码...", "info");
    setExpression("");

    const dataUrl = captchaToDataUrl(image);
    setPayloadPreview(dataUrl);
    const result = await browser.runtime.sendMessage({
      type: "OCR_RECOGNIZE",
      payload: {
        dataUrl
      }
    });

    if (runId !== activeRunId) {
      return;
    }

    if (!result?.ok) {
      console.warn("[shmtu-cas-ocr-crx] OCR failed", {
        reason,
        error: result?.error,
        result
      });
      setStatus(result?.error || "OCR 识别失败。", "error");
      return;
    }

    input.value = result.text;
    dispatchInputEvents(input);
    setExpression(result.expression || "");
    setPayloadPreview(dataUrl, result.endpointUrl || "");
    setStatus(`识别成功：${result.text}`, "success");
  } catch (error) {
    console.warn("[shmtu-cas-ocr-crx] Recognition error", {
      reason,
      error: error instanceof Error ? error.message : String(error)
    });
    setStatus(
      error instanceof Error ? error.message : String(error),
      "error"
    );
  } finally {
    if (runId === activeRunId) {
      setRetryButtonBusy(false);
    }
  }
}

function ensureRetryUi(image) {
  if (getRetryButton() && getStatusNode()) {
    return;
  }

  const appendContainer = image.parentElement;
  if (!appendContainer) {
    return;
  }

  appendContainer.style.display = "flex";
  appendContainer.style.flexDirection = "column";
  appendContainer.style.alignItems = "center";
  appendContainer.style.gap = "6px";

  const retryButton = document.createElement("button");
  retryButton.id = RETRY_BUTTON_ID;
  retryButton.type = "button";
  retryButton.textContent = "重新 OCR";
  retryButton.style.border = "0";
  retryButton.style.borderRadius = "999px";
  retryButton.style.padding = "6px 10px";
  retryButton.style.fontSize = "12px";
  retryButton.style.fontWeight = "700";
  retryButton.style.cursor = "pointer";
  retryButton.style.background = "#0b67b0";
  retryButton.style.color = "#ffffff";
  retryButton.style.whiteSpace = "nowrap";
  retryButton.addEventListener("click", () => {
    void recognizeCaptcha("manual-retry");
  });

  const rowContainer = image.closest(".d-flex");
  if (rowContainer && !getInfoRow()) {
    const infoRow = document.createElement("div");
    infoRow.id = INFO_ROW_ID;
    infoRow.style.marginTop = "8px";
    infoRow.style.padding = "8px 10px";
    infoRow.style.borderRadius = "10px";
    infoRow.style.background = "rgba(11, 103, 176, 0.06)";
    infoRow.style.display = "flex";
    infoRow.style.flexDirection = "column";
    infoRow.style.gap = "4px";

    const expressionNode = document.createElement("div");
    expressionNode.id = EXPRESSION_ID;
    expressionNode.style.fontSize = "12px";
    expressionNode.style.lineHeight = "1.45";
    expressionNode.style.color = "#0f172a";
    expressionNode.style.wordBreak = "break-word";
    expressionNode.style.fontWeight = "700";
    expressionNode.textContent = "OCR算式：等待识别";

    const statusNode = document.createElement("div");
    statusNode.id = STATUS_ID;
    statusNode.style.fontSize = "11px";
    statusNode.style.lineHeight = "1.35";
    statusNode.style.wordBreak = "break-word";
    statusNode.style.color = "#475569";

    const payloadMetaNode = document.createElement("div");
    payloadMetaNode.id = PAYLOAD_META_ID;
    payloadMetaNode.style.fontSize = "11px";
    payloadMetaNode.style.lineHeight = "1.35";
    payloadMetaNode.style.wordBreak = "break-word";
    payloadMetaNode.style.color = "#334155";
    payloadMetaNode.textContent = "发送数据：等待识别";

    const previewImageNode = document.createElement("img");
    previewImageNode.id = PREVIEW_IMG_ID;
    previewImageNode.alt = "发送到OCR服务的验证码预览";
    previewImageNode.style.display = "none";
    previewImageNode.style.maxWidth = "220px";
    previewImageNode.style.width = "100%";
    previewImageNode.style.border = "1px solid rgba(15, 23, 42, 0.16)";
    previewImageNode.style.borderRadius = "8px";
    previewImageNode.style.background = "#ffffff";

    const payloadDetails = document.createElement("details");
    payloadDetails.style.fontSize = "11px";
    payloadDetails.style.lineHeight = "1.35";

    const payloadSummary = document.createElement("summary");
    payloadSummary.textContent = "查看发送的 data URL";
    payloadSummary.style.cursor = "pointer";
    payloadSummary.style.color = "#0b67b0";

    const payloadTextNode = document.createElement("textarea");
    payloadTextNode.id = PAYLOAD_TEXT_ID;
    payloadTextNode.readOnly = true;
    payloadTextNode.style.marginTop = "6px";
    payloadTextNode.style.width = "100%";
    payloadTextNode.style.minHeight = "84px";
    payloadTextNode.style.boxSizing = "border-box";
    payloadTextNode.style.fontSize = "11px";
    payloadTextNode.style.lineHeight = "1.35";
    payloadTextNode.style.fontFamily = "monospace";
    payloadTextNode.style.border = "1px solid rgba(15, 23, 42, 0.16)";
    payloadTextNode.style.borderRadius = "8px";
    payloadTextNode.style.padding = "8px";
    payloadTextNode.style.background = "#ffffff";
    payloadTextNode.style.color = "#0f172a";

    payloadDetails.append(payloadSummary, payloadTextNode);

    infoRow.append(
      expressionNode,
      statusNode,
      payloadMetaNode,
      previewImageNode,
      payloadDetails
    );
    rowContainer.insertAdjacentElement("afterend", infoRow);
  }

  const statusNode = document.createElement("div");
  statusNode.id = STATUS_ID;
  statusNode.style.maxWidth = "90px";
  statusNode.style.fontSize = "11px";
  statusNode.style.lineHeight = "1.3";
  statusNode.style.textAlign = "center";
  statusNode.style.wordBreak = "break-word";
  statusNode.style.color = "#475569";
  appendContainer.append(retryButton);

  if (!getInfoRow() && !getStatusNode()) {
    appendContainer.append(statusNode);
  }
}

function bindCaptchaEvents(image) {
  if (image.dataset.shmtuCasOcrBound === "1") {
    return;
  }

  image.dataset.shmtuCasOcrBound = "1";
  ensureRetryUi(image);
  image.addEventListener("load", () => {
    scheduleRecognition("captcha-load", 200);
  });
  image.addEventListener("click", () => {
    scheduleRecognition("captcha-click", 500);
  });

  if (image.complete && image.naturalWidth > 0) {
    scheduleRecognition("initial-load", 250);
  }
}

function observeCaptchaAttributes(image) {
  if (captchaAttributeObserver) {
    captchaAttributeObserver.disconnect();
  }

  captchaAttributeObserver = new MutationObserver(() => {
    scheduleRecognition("captcha-src-change", 250);
  });
  captchaAttributeObserver.observe(image, {
    attributes: true,
    attributeFilter: ["src"]
  });
}

function ensureCaptchaObserved() {
  const image = getCaptchaImage();
  if (!image) {
    return;
  }

  if (observedCaptcha !== image) {
    observedCaptcha = image;
    ensureRetryUi(image);
    bindCaptchaEvents(image);
    observeCaptchaAttributes(image);
  }
}

function init() {
  if (!isTargetPage()) {
    return;
  }

  ensureCaptchaObserved();

  const rootObserver = new MutationObserver(() => {
    ensureCaptchaObserved();
  });

  rootObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

init();
