const urlInput = document.getElementById("url-input");
const generateButton = document.getElementById("generate-button");
const output = document.querySelector(".output");

const emptyMessage = "Enter a URL to generate a QR code.";

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
  if (!hasValue) {
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
  new QRCode(qrContainer, {
    text: value,
    width: 180,
    height: 180,
    colorDark: "#1d1d1f",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M,
  });
};

renderMessage(emptyMessage);
updateButtonState();

urlInput.addEventListener("input", updateButtonState);
generateButton.addEventListener("click", renderQRCode);
