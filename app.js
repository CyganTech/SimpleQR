const urlInput = document.getElementById("url-input");
const generateButton = document.getElementById("generate-button");
const downloadButton = document.getElementById("download-button");
const clearOutputButton = document.getElementById("clear-output-button");
const clearInputButton = document.getElementById("clear-input-button");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleLabel = document.getElementById("theme-toggle-label");
const sizeSelect = document.getElementById("size-select");
const errorSelect = document.getElementById("error-select");
const foregroundColor = document.getElementById("foreground-color");
const backgroundColor = document.getElementById("background-color");
const filenameInput = document.getElementById("filename-input");
const autoGenerateToggle = document.getElementById("auto-generate");
const copyButton = document.getElementById("copy-button");
const copyTextButton = document.getElementById("copy-text-button");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.querySelector(".status");
const output = document.querySelector(".output");

const requiredElements = [
  ["#url-input", urlInput],
  ["#generate-button", generateButton],
  ["#download-button", downloadButton],
  ["#clear-output-button", clearOutputButton],
  ["#clear-input-button", clearInputButton],
  ["#size-select", sizeSelect],
  ["#error-select", errorSelect],
  ["#foreground-color", foregroundColor],
  ["#background-color", backgroundColor],
  ["#filename-input", filenameInput],
  ["#auto-generate", autoGenerateToggle],
  ["#copy-button", copyButton],
  ["#copy-text-button", copyTextButton],
  ["#reset-button", resetButton],
  [".output", output],
];

const emptyMessage = "Enter text or a URL to generate a QR code.";
const copySuccessMessage = "Copied QR code to your clipboard.";
const copyErrorMessage =
  "Unable to copy image. Use HTTPS or localhost, or use Download PNG instead.";
const copyTextSuccessMessage = "Copied text to your clipboard.";
const copyTextErrorMessage =
  "Unable to copy text. Use HTTPS or localhost, or select and copy manually.";
const qrDependencyErrorMessage =
  "QR code generator failed to load. Check your connection and refresh.";
const themeStorageKey = "simpleqr-theme";
const defaultSettings = {
  size: "180",
  error: "M",
  filename: "",
  autoGenerate: false,
};

let currentQRCode = null;

const debounce = (callback, delay = 200) => {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

const trackEvent = (name, params = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
};

const renderMessage = (message, announce = false) => {
  output.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  output.append(paragraph);
  if (announce) {
    renderStatus(message);
  }
};

const renderStatus = (message) => {
  if (statusMessage) {
    statusMessage.textContent = message;
  }
};

const setDisabled = (element, disabled) => {
  if (element) {
    element.disabled = disabled;
  }
};

const attachEvent = (element, eventName, handler) => {
  if (element) {
    element.addEventListener(eventName, handler);
  }
};

const getQRColors = () => ({
  colorDark: foregroundColor.value,
  colorLight: backgroundColor.value,
});

const getQRSize = () => Number.parseInt(sizeSelect.value, 10);

const getErrorCorrectionLevel = () =>
  QRCode.CorrectLevel[errorSelect.value] ?? QRCode.CorrectLevel.M;

const updateButtonState = () => {
  const value = urlInput.value.trim();
  const hasValue = value.length > 0;
  setDisabled(generateButton, !hasValue);
  const hasQRCode = Boolean(currentQRCode);
  setDisabled(clearInputButton, !hasValue && !hasQRCode);
  setDisabled(clearOutputButton, !hasQRCode);
  setDisabled(downloadButton, !hasQRCode);
  setDisabled(copyButton, !hasQRCode);
  setDisabled(copyTextButton, !hasValue);
  if (!hasValue && !hasQRCode) {
    renderMessage(emptyMessage, true);
  }
};

const renderQRCode = (source = "manual") => {
  const value = urlInput.value.trim();
  if (!value) {
    renderMessage(emptyMessage, true);
    return;
  }
  if (typeof QRCode === "undefined") {
    renderStatus(qrDependencyErrorMessage);
    return;
  }

  output.innerHTML = "";
  const qrContainer = document.createElement("div");
  output.append(qrContainer);
  const size = getQRSize();
  const { colorDark, colorLight } = getQRColors();
  currentQRCode = new QRCode(qrContainer, {
    text: value,
    width: size,
    height: size,
    colorDark,
    colorLight,
    correctLevel: getErrorCorrectionLevel(),
  });
  setDisabled(downloadButton, false);
  setDisabled(clearOutputButton, false);
  setDisabled(clearInputButton, false);
  setDisabled(copyButton, false);
  renderStatus("");
  trackEvent("generate_qr", {
    source,
    size,
    error_correction: errorSelect.value,
  });
};

const getQRImageSource = () => {
  const image = output.querySelector("img");
  if (image?.src) {
    return image.src;
  }
  const canvas = output.querySelector("canvas");
  return canvas ? canvas.toDataURL("image/png") : null;
};

const getQRCodeBlob = async () => {
  const canvas = output.querySelector("canvas");
  if (canvas) {
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }
  const image = output.querySelector("img");
  if (image?.src) {
    const response = await fetch(image.src);
    return await response.blob();
  }
  return null;
};

const sanitizeFilename = (value) => {
  const cleaned = value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "");
  return cleaned.length > 0 ? cleaned : "simpleqr";
};

const isFilenameCustomized = () => filenameInput.dataset.customized === "true";

const deriveFilename = (value) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "simpleqr";
  }
  let base = "";
  if (!/\s/.test(trimmed)) {
    try {
      base = new URL(trimmed).hostname;
    } catch (error) {
      try {
        base = new URL(`https://${trimmed}`).hostname;
      } catch (innerError) {
        base = "";
      }
    }
  }
  if (!base) {
    base = trimmed;
  }
  const cleaned = base.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").trim();
  const shortened = cleaned.slice(0, 20);
  return shortened.length > 0 ? shortened : "simpleqr";
};

const updateFilenameFromInput = () => {
  if (isFilenameCustomized()) {
    return;
  }
  filenameInput.value = deriveFilename(urlInput.value);
};

const downloadQRCode = () => {
  const source = getQRImageSource();
  if (!source) {
    return;
  }
  const link = document.createElement("a");
  link.href = source;
  link.download = `${sanitizeFilename(filenameInput.value)}.png`;
  link.click();
  trackEvent("download_qr", { format: "png" });
};

const copyQRCode = async () => {
  if (!navigator.clipboard) {
    renderStatus(
      "Copy image is unavailable in this browser context. Use HTTPS or localhost, or use Download PNG instead.",
    );
    return;
  }
  if (!window.ClipboardItem || typeof navigator.clipboard.write !== "function") {
    renderStatus(
      "Copy image is not supported by this browser. Use Download PNG instead.",
    );
    return;
  }

  try {
    const blob = await getQRCodeBlob();
    if (!blob) {
      renderStatus(copyErrorMessage);
      return;
    }
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    renderStatus(copySuccessMessage);
    trackEvent("copy_qr", { format: "png" });
  } catch (error) {
    renderStatus(copyErrorMessage);
  }
};

const copyInputText = async () => {
  const value = urlInput.value.trim();
  if (!value) {
    renderStatus(emptyMessage);
    return;
  }
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    renderStatus(
      "Copy text is unavailable in this browser context. Use HTTPS or localhost, or select and copy manually.",
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    renderStatus(copyTextSuccessMessage);
    trackEvent("copy_text", { length: value.length });
  } catch (error) {
    renderStatus(copyTextErrorMessage);
  }
};

const clearOutputOnly = () => {
  if (!currentQRCode) {
    renderStatus("No QR code to clear.");
    updateButtonState();
    return;
  }

  currentQRCode = null;
  renderMessage(emptyMessage, false);
  renderStatus("Cleared rendered QR code.");
  updateButtonState();
  trackEvent("clear_output_only");
};

const clearInputAndOutput = () => {
  const hadInput = urlInput.value.trim().length > 0;
  const hadOutput = Boolean(currentQRCode);

  if (!hadInput && !hadOutput) {
    renderStatus("Nothing to clear.");
    updateButtonState();
    return;
  }

  urlInput.value = "";
  currentQRCode = null;
  updateFilenameFromInput();
  renderMessage(emptyMessage, false);
  renderStatus("Cleared input text and rendered QR code.");
  updateButtonState();
  trackEvent("clear_input_and_output", {
    cleared_input: hadInput,
    cleared_output: hadOutput,
  });
};

const resetOptions = () => {
  sizeSelect.value = defaultSettings.size;
  errorSelect.value = defaultSettings.error;
  filenameInput.value = defaultSettings.filename;
  delete filenameInput.dataset.customized;
  autoGenerateToggle.checked = defaultSettings.autoGenerate;
  delete foregroundColor.dataset.custom;
  delete backgroundColor.dataset.custom;
  initColorInputs();
  renderStatus("");
  if (currentQRCode && urlInput.value.trim()) {
    renderQRCode("reset");
  } else {
    updateButtonState();
  }
  trackEvent("reset_options");
};

const initColorInputs = () => {
  const styles = getComputedStyle(document.body);
  if (!foregroundColor.dataset.custom) {
    foregroundColor.value = styles.getPropertyValue("--qr-foreground").trim();
  }
  if (!backgroundColor.dataset.custom) {
    backgroundColor.value = styles.getPropertyValue("--qr-background").trim();
  }
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  const label = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
  themeToggleLabel.textContent = label;
  if (!foregroundColor.dataset.custom || !backgroundColor.dataset.custom) {
    initColorInputs();
  }
  if (currentQRCode) {
    renderQRCode("theme");
  }
};

const getStoredTheme = () => {
  try {
    return window.localStorage.getItem(themeStorageKey);
  } catch (error) {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    window.localStorage.setItem(themeStorageKey, theme);
  } catch (error) {
    // Ignore storage failures (for example, blocked or unavailable storage).
  }
};

const maybeAutoGenerate = () => {
  updateButtonState();
  if (autoGenerateToggle.checked && urlInput.value.trim()) {
    renderQRCode("auto");
  }
};

const debouncedAutoGenerate = debounce(() => {
  if (autoGenerateToggle.checked && urlInput.value.trim()) {
    renderQRCode("auto");
  }
}, 200);

const debouncedOptionRegenerate = debounce(() => {
  if (currentQRCode || (autoGenerateToggle.checked && urlInput.value.trim())) {
    renderQRCode("update");
  }
}, 150);

const handleManualGenerate = () => {
  if (!urlInput.value.trim()) {
    updateButtonState();
    return;
  }
  renderQRCode("manual");
  updateButtonState();
};

const markCustomColor = (input) => {
  if (input === foregroundColor) {
    foregroundColor.dataset.custom = "true";
  }
  if (input === backgroundColor) {
    backgroundColor.dataset.custom = "true";
  }
};

const initializeApp = () => {
  const missingRequiredElements = requiredElements
    .filter(([, element]) => !element)
    .map(([selector]) => selector);

  if (missingRequiredElements.length > 0) {
    console.warn(
      `SimpleQR initialization skipped. Missing required element(s): ${missingRequiredElements.join(", ")}.`,
    );
    return;
  }

  const savedTheme = getStoredTheme();
  const supportsMatchMedia = typeof window.matchMedia === "function";
  const preferredTheme =
    savedTheme ||
    (supportsMatchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  applyTheme(preferredTheme);

  initColorInputs();

  renderMessage(emptyMessage, false);
  updateButtonState();

  attachEvent(urlInput, "input", () => {
    updateFilenameFromInput();
    updateButtonState();
    if (autoGenerateToggle.checked && urlInput.value.trim()) {
      debouncedAutoGenerate();
    }
  });
  attachEvent(filenameInput, "input", () => {
    filenameInput.dataset.customized = "true";
  });
  attachEvent(urlInput, "keydown", (event) => {
    if (event.isComposing || event.key !== "Enter") {
      return;
    }
    if (!urlInput.value.trim()) {
      return;
    }
    event.preventDefault();
    handleManualGenerate();
  });
  attachEvent(generateButton, "click", handleManualGenerate);
  attachEvent(downloadButton, "click", downloadQRCode);
  attachEvent(copyButton, "click", copyQRCode);
  attachEvent(copyTextButton, "click", copyInputText);
  attachEvent(clearOutputButton, "click", clearOutputOnly);
  attachEvent(clearInputButton, "click", clearInputAndOutput);
  attachEvent(resetButton, "click", resetOptions);
  attachEvent(themeToggle, "click", () => {
    const nextTheme = document.body.classList.contains("dark-mode")
      ? "light"
      : "dark";
    setStoredTheme(nextTheme);
    applyTheme(nextTheme);
    trackEvent("toggle_theme", { theme: nextTheme });
  });

  [foregroundColor, backgroundColor].forEach((input) => {
    attachEvent(input, "input", () => {
      markCustomColor(input);
      debouncedOptionRegenerate();
    });
  });

  [sizeSelect, errorSelect].forEach((input) => {
    attachEvent(input, "input", () => {
      debouncedOptionRegenerate();
    });
  });

  attachEvent(autoGenerateToggle, "change", (event) => {
    maybeAutoGenerate();
    trackEvent("toggle_auto_generate", { enabled: event.target.checked });
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
} else {
  initializeApp();
}
