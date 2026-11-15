const list = document.querySelector("#device-list");
const chooseButton = document.querySelector("#choose-button");
const refreshButton = document.querySelector("#refresh-button");
const message = document.querySelector("#message");
const browserStatus = document.querySelector("#browser-status");
const browserStatusText = document.querySelector("#browser-status-text");

function supported() {
  return window.isSecureContext && "usb" in navigator;
}

function setMessage(text) {
  message.textContent = text;
}

function deviceTitle(device) {
  return device.productName || `USB device ${device.vendorId.toString(16).padStart(4,"0")}:${device.productId.toString(16).padStart(4,"0")}`;
}

function render(devices) {
  list.replaceChildren();
  if (!devices.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "許可済みのUSB機器はありません。「USB機器を選択」から追加してください。";
    list.append(empty);
    return;
  }

  for (const device of devices) {
    const card = document.createElement("article");
    card.className = "device";
    const info = document.createElement("div");
    const name = document.createElement("div");
    name.className = "device-name";
    name.textContent = deviceTitle(device);
    const meta = document.createElement("div");
    meta.className = "device-meta";
    meta.textContent = [
      `Vendor ID: 0x${device.vendorId.toString(16).padStart(4,"0")}`,
      `Product ID: 0x${device.productId.toString(16).padStart(4,"0")}`,
      device.manufacturerName || ""
    ].filter(Boolean).join(" · ");
    info.append(name, meta);
    const tag = document.createElement("span");
    tag.className = "device-tag";
    tag.textContent = "選択許可済み";
    card.append(info, tag);
    list.append(card);
  }
}

async function refresh() {
  if (!supported()) return;
  try {
    render(await navigator.usb.getDevices());
  } catch (error) {
    setMessage(`一覧の取得に失敗しました: ${error.message}`);
  }
}

if (!supported()) {
  browserStatus.classList.add("bad");
  browserStatusText.textContent = "この環境ではWebUSBを利用できません";
  chooseButton.disabled = true;
  refreshButton.disabled = true;
  list.textContent = "Chrome系ブラウザのHTTPSページで開いてください。学校の端末ポリシーによって利用できない場合もあります。";
} else {
  browserStatus.classList.add("ok");
  browserStatusText.textContent = "WebUSBを利用できます";
  refresh();
}

chooseButton.addEventListener("click", async () => {
  if (!supported()) return;
  setMessage("");
  try {
    const device = await navigator.usb.requestDevice({ filters: [] });
    setMessage(`選択しました: ${deviceTitle(device)}`);
    await refresh();
  } catch (error) {
    if (error.name === "NotFoundError") {
      setMessage("機器は選択されませんでした。");
    } else {
      setMessage(`選択できませんでした: ${error.message}`);
    }
  }
});

refreshButton.addEventListener("click", refresh);

if ("usb" in navigator) {
  navigator.usb.addEventListener("connect", refresh);
  navigator.usb.addEventListener("disconnect", refresh);
}