const urlInput = document.getElementById("url-input");
const generateButton = document.getElementById("generate-button");
const downloadButton = document.getElementById("download-button");
const clearButton = document.getElementById("clear-button");
const themeToggle = document.getElementById("theme-toggle");
const sizeSelect = document.getElementById("size-select");
const errorSelect = document.getElementById("error-select");
const foregroundColor = document.getElementById("foreground-color");
const backgroundColor = document.getElementById("background-color");
const filenameInput = document.getElementById("filename-input");
const autoGenerateToggle = document.getElementById("auto-generate");
const copyButton = document.getElementById("copy-button");
const resetButton = document.getElementById("reset-button");
const statusMessage = document.querySelector(".status");
const output = document.querySelector(".output");

const emptyMessage = "Enter a URL to generate a QR code.";
const copySuccessMessage = "Copied QR code to your clipboard.";
const copyErrorMessage = "Unable to copy. Try downloading instead.";
const themeStorageKey = "simpleqr-theme";
const defaultSettings = {
  size: "180",
  error: "M",
  filename: "",
  autoGenerate: false,
};

let currentQRCode = null;

const renderMessage = (message) => {
  output.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  output.append(paragraph);
};

const renderStatus = (message) => {
  statusMessage.textContent = message;
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
  generateButton.disabled = !hasValue;
  clearButton.disabled = !hasValue && !currentQRCode;
  downloadButton.disabled = !currentQRCode;
  copyButton.disabled = !currentQRCode;
  if (!hasValue && !currentQRCode) {
    renderMessage(emptyMessage);
  }
};

const renderQRCode = () => {
  const value = urlInput.value.trim();
  if (!value) {
    renderMessage(emptyMessage);
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
  downloadButton.disabled = false;
  clearButton.disabled = false;
  copyButton.disabled = false;
  renderStatus("");
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

const downloadQRCode = () => {
  const source = getQRImageSource();
  if (!source) {
    return;
  }
  const link = document.createElement("a");
  link.href = source;
  link.download = `${sanitizeFilename(filenameInput.value)}.png`;
  link.click();
};

const copyQRCode = async () => {
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
  } catch (error) {
    renderStatus(copyErrorMessage);
  }
};

const clearQRCode = () => {
  urlInput.value = "";
  currentQRCode = null;
  renderMessage(emptyMessage);
  renderStatus("");
  updateButtonState();
};

const resetOptions = () => {
  sizeSelect.value = defaultSettings.size;
  errorSelect.value = defaultSettings.error;
  filenameInput.value = defaultSettings.filename;
  autoGenerateToggle.checked = defaultSettings.autoGenerate;
  delete foregroundColor.dataset.custom;
  delete backgroundColor.dataset.custom;
  initColorInputs();
  renderStatus("");
  if (currentQRCode && urlInput.value.trim()) {
    renderQRCode();
  } else {
    updateButtonState();
  }
};

const initColorInputs = () => {
  const styles = getComputedStyle(document.body);
  if (!foregroundColor.dataset.custom) {
    foregroundColor.value = styles.getPropertyValue("--text").trim();
  }
  if (!backgroundColor.dataset.custom) {
    backgroundColor.value = styles.getPropertyValue("--card-bg").trim();
  }
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  if (!foregroundColor.dataset.custom || !backgroundColor.dataset.custom) {
    initColorInputs();
  }
  if (currentQRCode) {
    renderQRCode();
  }
};

const savedTheme = localStorage.getItem(themeStorageKey);
const preferredTheme =
  savedTheme ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");
applyTheme(preferredTheme);

initColorInputs();

renderMessage(emptyMessage);
updateButtonState();

const maybeAutoGenerate = () => {
  updateButtonState();
  if (autoGenerateToggle.checked && urlInput.value.trim()) {
    renderQRCode();
  }
};

urlInput.addEventListener("input", maybeAutoGenerate);
generateButton.addEventListener("click", renderQRCode);
downloadButton.addEventListener("click", downloadQRCode);
copyButton.addEventListener("click", copyQRCode);
clearButton.addEventListener("click", clearQRCode);
resetButton.addEventListener("click", resetOptions);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode")
    ? "light"
    : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});

const markCustomColor = () => {
  foregroundColor.dataset.custom = "true";
  backgroundColor.dataset.custom = "true";
};

[foregroundColor, backgroundColor].forEach((input) => {
  input.addEventListener("input", () => {
    markCustomColor();
    if (currentQRCode || (autoGenerateToggle.checked && urlInput.value.trim())) {
      renderQRCode();
    }
  });
});

[sizeSelect, errorSelect].forEach((input) => {
  input.addEventListener("input", () => {
    if (currentQRCode || (autoGenerateToggle.checked && urlInput.value.trim())) {
      renderQRCode();
    }
  });
});

autoGenerateToggle.addEventListener("change", maybeAutoGenerate);
