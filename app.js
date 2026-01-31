const urlInput = document.getElementById("url-input");
const generateButton = document.getElementById("generate-button");
const downloadButton = document.getElementById("download-button");
const clearButton = document.getElementById("clear-button");
const themeToggle = document.getElementById("theme-toggle");
const output = document.querySelector(".output");

const emptyMessage = "Enter a URL to generate a QR code.";
const themeStorageKey = "simpleqr-theme";

let currentQRCode = null;

const renderMessage = (message) => {
  output.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  output.append(paragraph);
};

const updateButtonState = () => {
  const value = urlInput.value.trim();
  const hasValue = value.length > 0;
  generateButton.disabled = !hasValue;
  clearButton.disabled = !hasValue && !currentQRCode;
  downloadButton.disabled = !currentQRCode;
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
  currentQRCode = new QRCode(qrContainer, {
    text: value,
    width: 180,
    height: 180,
    colorDark: getComputedStyle(document.body).getPropertyValue("--text").trim(),
    colorLight: getComputedStyle(document.body).getPropertyValue("--card-bg").trim(),
    correctLevel: QRCode.CorrectLevel.M,
  });
  downloadButton.disabled = false;
  clearButton.disabled = false;
};

const getQRImageSource = () => {
  const image = output.querySelector("img");
  if (image?.src) {
    return image.src;
  }
  const canvas = output.querySelector("canvas");
  return canvas ? canvas.toDataURL("image/png") : null;
};

const downloadQRCode = () => {
  const source = getQRImageSource();
  if (!source) {
    return;
  }
  const link = document.createElement("a");
  link.href = source;
  link.download = "simpleqr.png";
  link.click();
};

const clearQRCode = () => {
  urlInput.value = "";
  currentQRCode = null;
  renderMessage(emptyMessage);
  updateButtonState();
};

const applyTheme = (theme) => {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
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

renderMessage(emptyMessage);
updateButtonState();

urlInput.addEventListener("input", updateButtonState);
generateButton.addEventListener("click", renderQRCode);
downloadButton.addEventListener("click", downloadQRCode);
clearButton.addEventListener("click", clearQRCode);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark-mode")
    ? "light"
    : "dark";
  localStorage.setItem(themeStorageKey, nextTheme);
  applyTheme(nextTheme);
});
