// ======================
// ELEMENTY HTML
// ======================
const modal = document.getElementById("publicProjectModal");
const projectNameInput = document.getElementById("projectNameInput");
const projectCategory = document.getElementById("projectCategory");
const projectTags = document.getElementById("projectTags");
const projectDescription = document.getElementById("projectDescription");

const saveProjectMetaBtn = document.getElementById("saveProjectMeta");
const cancelProjectMetaBtn = document.getElementById("cancelProjectMeta");
const addTextBtn = document.getElementById("addTextBtn");
function openPublicModal(board) {
  modal.classList.remove("hidden");

  projectNameInput.value = board.name || "";
  projectDescription.value = board.meta?.description || "";
  projectTags.value = (board.meta?.tags || []).join(", ");

  // 🔥 ustaw zaznaczone kategorie
  const selected = board.meta?.categories || [];

  Array.from(projectCategory.options).forEach(opt => {
    opt.selected = selected.includes(opt.value);
  });
}

saveProjectMetaBtn.onclick = async () => {
  const index = loadBoardsIndex();
  const b = index.boards.find(b => b.id === activeBoardId);
  if (!b) return;

  b.name = projectNameInput.value;

b.meta = {
  description: projectDescription.value,
  tags: projectTags.value
    .split(",")
    .map(t => t.trim())
    .filter(Boolean),

  categories: Array.from(projectCategory.selectedOptions).map(o => o.value)
};

  b.public = true;
  b.updated = Date.now();

  modal.classList.add("hidden");

  saveBoardsIndex(index);
  renderBoardsList();

  await ensureImagesUploadedForPublicBoard();
  await syncBoardToSupabase(b);
};
cancelProjectMetaBtn.onclick = () => {
  modal.classList.add("hidden");

  // cofnięcie toggle
  boardPublicToggle.checked = false;
};
function loadUserProfileHeader() {
  const profileRaw = localStorage.getItem("profile");
  if (!profileRaw) return;

  const profile = JSON.parse(profileRaw);

  const avatarEl = document.getElementById("userAvatar");
  const nameEl = document.getElementById("userName");

  if (avatarEl && profile.avatar) {
    avatarEl.src = profile.avatar;
  }

  if (nameEl && profile.name) {
    nameEl.textContent = profile.name;
  }
}

async function syncBoardToSupabase(boardMeta) {

  const { data, error: userError } =
    await window.supabaseClient.auth.getUser();

  if (userError || !data.user) return;

  const userId = data.user.id;

  const { error } = await window.supabaseClient
    .from("boards")
    .upsert({
  id: boardMeta.id,
  name: boardMeta.name,
  preview: boardMeta.preview,
  public: boardMeta.public,
  owner_id: userId,
  updated_at: new Date().toISOString(),

  meta: boardMeta.meta, // ⬅⬅⬅ NOWE

  content: {
    items: boardItems,
    background: boardBackground
  }
});

  if (error) {
    console.error(error);
  }
}

async function uploadImageToStorage(file, boardId) {

  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;

  const path = `${boardId}/${fileName}`;

  const { error } = await window.supabaseClient
    .storage
    .from("board-images")
    .upload(path, file, {
      upsert: false
    });

  if (error) {
    console.error("Storage upload error", error);
    return null;
  }

  return path;
}


const boardPublicToggle = document.getElementById("boardPublicToggle");

loadUserProfileHeader();
const userInfo = document.querySelector(".user-info");
if (userInfo) {
  userInfo.style.cursor = "pointer";
  userInfo.onclick = () => {
    window.location.href = "../profil/profile.html";
  };
}

const userId = localStorage.getItem("userId");
if (!userId) {
  window.location.href = "../profil/profile.html";
}

function userKey(key) {
  return `${key}:${userId}`;
}

const BOARDS_INDEX_KEY = userKey("boards:index");
let activeBoardId = null;
const boardSelect = document.getElementById("boardSelect");
const btnNewBoard = document.getElementById("btnNewBoard");
const btnExportBoard = document.getElementById("btnExportBoard");


let bgImageUrl = null;

const imageUrlCache = new Map();
const bgLayer = document.getElementById("boardBackgroundLayer");

const board = document.getElementById("board");
const boardInner = document.getElementById("boardInner");
const btnResetView = document.getElementById("btnResetView");
btnResetView.onclick = resetView;
const btnZoomIn = document.getElementById("btnZoomIn");
const btnZoomOut = document.getElementById("btnZoomOut");


const boardImageInput = document.getElementById("boardImageInput");

const toolbar = document.getElementById("boardToolbar");
toolbar.addEventListener("mousedown", e => e.stopPropagation());

const bgImageInput = document.getElementById("bgImageInput");
const btnRemoveBgImage = document.getElementById("btnRemoveBgImage");


const btnDelete = document.getElementById("btnDelete");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnShape = document.getElementById("btnShape");
const btnRotateLeft = document.getElementById("btnRotateLeft");
const btnRotateRight = document.getElementById("btnRotateRight");
const btnFlipX = document.getElementById("btnFlipX");
const btnFlipY = document.getElementById("btnFlipY");
const btnLock = document.getElementById("btnLock");

const btnBold = document.getElementById("btnBold");
const btnItalic = document.getElementById("btnItalic");
const btnAlignLeft = document.getElementById("btnAlignLeft");
const btnAlignCenter = document.getElementById("btnAlignCenter");
const btnAlignRight = document.getElementById("btnAlignRight");

const fontSizeInput = document.getElementById("fontSizeInput");
const fontSelect = document.getElementById("fontSelect");
const textColorInput = document.getElementById("textColorInput");
const bgOpacityInput = document.getElementById("bgOpacityInput");
const btnTextBg = document.getElementById("btnTextBg");

const gradientFrom = document.getElementById("gradientFrom");
const gradientTo = document.getElementById("gradientTo");
const gradientDirection = document.getElementById("gradientDirection");
const btnGradient = document.getElementById("btnGradient");
const btnSolid = document.getElementById("btnSolid");
const ZOOM_STEP = 0.08;
const PAN_SENSITIVITY = 0.6; // 0.3 = bardzo delikatnie, 1 = jak teraz

const btnRenameBoard = document.getElementById("btnRenameBoard");

btnRenameBoard.onclick = () => {
  const index = loadBoardsIndex();
  const current = index.boards.find(b => b.id === activeBoardId);
  if (!current) return;

  const name = prompt("Nowa nazwa boardu:", current.name);
  if (!name) return;

  renameBoard(activeBoardId, name);
  renderBoardsList();
};
const btnDeleteBoard = document.getElementById("btnDeleteBoard");

btnDeleteBoard.onclick = () => {
  if (!confirm("Usunąć ten board? Tej operacji nie da się cofnąć.")) return;

  deleteBoard(activeBoardId);

  const index = loadBoardsIndex();
  activeBoardId = index.activeBoardId;

  loadBoard(activeBoardId);
  renderBoardsList();
};

// ======================
// INDEXEDDB – MINIMAL WRAPPER
// ======================

const DB_NAME = "WhiteboardDB";
const DB_VERSION = 1;
const IMAGE_STORE = "images";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function withStore(mode, fn) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IMAGE_STORE, mode);
      const store = tx.objectStore(IMAGE_STORE);

      fn(store, resolve, reject);

      tx.onerror = () => reject(tx.error);
    });
  });
}

// ======================
// API
// ======================

function saveImage(id, blob) {
  return withStore("readwrite", (store, resolve, reject) => {
    const req = store.put(blob, id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function deleteImage(id) {
  return withStore("readwrite", (store, resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}


function getImage(id) {
  return withStore("readonly", (store, resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}



bgImageInput.addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  const imageId = "bg_" + Date.now();
  await saveImage(imageId, file);

  boardBackground.type = "image";
  boardBackground.imageId = imageId;
  boardBackground.imageFit = "cover";

  saveBoard();
  applyBoardBackground();

  bgImageInput.value = "";
  let storagePath = null;

const index = loadBoardsIndex();
const b = index.boards.find(b => b.id === activeBoardId);

if (b?.public) {
  storagePath = await uploadImageToStorage(file, activeBoardId);
}

boardBackground.type = "image";
boardBackground.imageId = imageId;
boardBackground.storagePath = storagePath; // ⬅⬅⬅ KLUCZ
boardBackground.imageFit = "cover";

});


// ======================
// STAN
// ======================
let textInsertMode = false;

let boardBackground = {
  type: "solid", // "solid" | "gradient" | "image"
  color: "#f4f4f4",
  gradient: {
    from: "#ffffff",
    to: "#dcdcdc",
    direction: "to bottom"
  },
  imageId: null,     // ID obrazu w IndexedDB
  imageFit: "cover"  // cover | contain | repeat
};


let boardItems = [];
let selectedItem = null;
let draggingItem = null;
let resizingItem = null;

let boardScale = 1;
const MIN_SCALE = 0.6;
const MAX_SCALE = 3;

let boardOffsetX = 0;
let boardOffsetY = 0;




let offsetX = 0;
let offsetY = 0;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

let isRightPanning = false;
let rightPanStartX = 0;
let rightPanStartY = 0;


// ======================
// POMOCNICZE
// ======================
async function migrateImagesToStorageForCurrentBoard() {

  let changed = false;

  for (const item of boardItems) {

    if (item.type !== "image") continue;
    if (item.storagePath) continue;

    const blob = await getImage(item.imageId);
    if (!blob) {
      console.warn("Brak blobu dla", item.imageId);
      continue;
    }

    const file = new File([blob], "image.png", { type: blob.type });

    const path = await uploadImageToStorage(file, activeBoardId);

    if (path) {
      item.storagePath = path;
      changed = true;
    }
  }

  if (!changed) {
    console.info("Brak obrazów do migracji.");
    return;
  }

  saveBoard();

  const index = loadBoardsIndex();
  const b = index.boards.find(x => x.id === activeBoardId);

  if (b && b.public) {
    await syncBoardToSupabase(b);
  }

  console.info("Migracja obrazów zakończona.");
}


function loadBoardsIndex() {
  const raw = localStorage.getItem(BOARDS_INDEX_KEY);
  if (!raw) {
    const firstId = "board_" + Date.now();
    const index = {
      activeBoardId: firstId,
      boards: [{ id: firstId, name: "Board 1", updated: Date.now(), public: false }]
    };
    localStorage.setItem(BOARDS_INDEX_KEY, JSON.stringify(index));
    return index;
  }

  const index = JSON.parse(raw);

  let changed = false;
 index.boards.forEach(b => {
  if (typeof b.public !== "boolean") {
    b.public = false;
    changed = true;
  }

  // 🔥 NOWE
  if (!b.meta) {
    b.meta = {
      description: "",
      tags: [],
      categories: []
    };
    changed = true;
  }
});

  if (changed) saveBoardsIndex(index);

  return index;
}

function saveBoardsIndex(index) {
  localStorage.setItem(BOARDS_INDEX_KEY, JSON.stringify(index));
}

async function migrateBoardToIndexedDB() {
  const raw = localStorage.getItem("whiteboard");
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    localStorage.removeItem("whiteboard");
    return;
  }

  if (!Array.isArray(data.items)) return;

  let migrated = false;

  for (const item of data.items) {
    if (item.type === "image" && item.src?.startsWith("data:")) {
      const res = await fetch(item.src);
      const blob = await res.blob();

      const imageId = "img_" + item.id;
      await saveImage(imageId, blob);

      delete item.src;
      item.imageId = imageId;

      migrated = true;
    }
  }

  if (migrated) {
    localStorage.setItem("whiteboard", JSON.stringify(data));
    console.info("✔ Board migrated to IndexedDB");
  }
}

function makePreview(canvas) {
  const p = document.createElement("canvas");

  const maxWidth = 400;
  const scale = maxWidth / canvas.width;

  p.width = maxWidth;
  p.height = Math.round(canvas.height * scale);

  const ctx = p.getContext("2d");
  ctx.drawImage(canvas, 0, 0, p.width, p.height);

  return p.toDataURL("image/jpeg", 0.7);
}

function syncBoardPublicToggle() {
  if (!boardPublicToggle || !activeBoardId) return;

  const index = loadBoardsIndex();
  const b = index.boards.find(b => b.id === activeBoardId);

  if (!b) return;

  boardPublicToggle.checked = !!b.public;
}
if (boardPublicToggle) {
  boardPublicToggle.onchange = async () => {
    const index = loadBoardsIndex();
    const b = index.boards.find(b => b.id === activeBoardId);
    if (!b) return;

    // 🔥 WŁĄCZANIE PUBLIC → formularz
   if (boardPublicToggle.checked) {
  boardPublicToggle.checked = false; // 🔥 reset
  openPublicModal(b);
  return;
}

    // 🔒 WYŁĄCZANIE PUBLIC
b.public = false;
b.updated = Date.now();

saveBoardsIndex(index);
renderBoardsList();

await syncBoardToSupabase(b);

    
  };
}





async function ensureImagesUploadedForPublicBoard() {

  let changed = false;

  for (const item of boardItems) {

    if (item.type !== "image") continue;
    if (item.storagePath) continue;

    const blob = await getImage(item.imageId);
    if (!blob) continue;

    const file = new File([blob], "image.png", { type: blob.type });

    const path = await uploadImageToStorage(file, activeBoardId);

    if (path) {
      item.storagePath = path;
      changed = true;
    }
  }

  if (changed) {
    saveBoard();

    const index = loadBoardsIndex();
    const b = index.boards.find(x => x.id === activeBoardId);

    if (b && b.public) {
      await syncBoardToSupabase(b);   // ⬅⬅⬅ KLUCZOWA LINIJKA
    }
  }
}

function applyZoom() {

  const rect = board.getBoundingClientRect();

  const boardWidth = 1920 * boardScale;
  const boardHeight = 1080 * boardScale;

  // 👉 centrowanie gdy board mniejszy niż ekran
  let offsetX = (rect.width - boardWidth) / 2;
  let offsetY = (rect.height - boardHeight) / 2;

  // 👉 jeśli większy → ogranicz panowanie
  if (boardWidth > rect.width) {
    const minX = rect.width - boardWidth;
    const maxX = 0;
    boardOffsetX = Math.max(minX, Math.min(maxX, boardOffsetX));
    offsetX = boardOffsetX;
  } else {
    boardOffsetX = offsetX;
  }

  if (boardHeight > rect.height) {
    const minY = rect.height - boardHeight;
    const maxY = 0;
    boardOffsetY = Math.max(minY, Math.min(maxY, boardOffsetY));
    offsetY = boardOffsetY;
  } else {
    boardOffsetY = offsetY;
  }

  boardInner.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${boardScale})`;
}

const SHAPES = ["square", "round", "circle", "triangle", "star", "heart"];

function nextShape(current) {
  const i = SHAPES.indexOf(current);
  return SHAPES[(i + 1) % SHAPES.length];
}

// ======================
// SAVE / LOAD
// ======================

async function saveBoard() {
  if (!activeBoardId) return;

  localStorage.setItem(
    "board:" + activeBoardId,
    JSON.stringify({
      items: boardItems,
      background: boardBackground
    })
  );

  const index = loadBoardsIndex();
  const b = index.boards.find(b => b.id === activeBoardId);

  if (b) {
    b.updated = Date.now();

    if (b.public && !saveBoard._previewLock) {
  saveBoard._previewLock = true;

  setTimeout(async () => {
    const index2 = loadBoardsIndex();
    const bb = index2.boards.find(x => x.id === activeBoardId);

    if (bb && bb.public) {
      bb.preview = await generateBoardPreview();
      saveBoardsIndex(index2);
      await syncBoardToSupabase(bb);
    }

    saveBoard._previewLock = false;
  }, 800);
}

  }

  saveBoardsIndex(index);
}



function loadBoard(boardId) {
  const raw = localStorage.getItem("board:" + boardId);

  activeBoardId = boardId;
  boardOffsetX = 0;
  boardOffsetY = 0;
  boardScale = 1;
  applyZoom();

  if (!raw) {
  boardItems = [];
  applyBoardBackground();
  renderBoard();
  syncBoardPublicToggle();
  ensurePreviewForCurrentBoard();
  return;
}


  const parsed = JSON.parse(raw);
  boardItems = parsed.items || [];
  boardBackground = parsed.background || boardBackground;

  applyBoardBackground();
  renderBoard();
  syncBoardPublicToggle();
  ensurePreviewForCurrentBoard();

}

async function ensurePreviewForCurrentBoard() {
  const index = loadBoardsIndex();
  const b = index.boards.find(x => x.id === activeBoardId);

  if (!b) return;
  if (!b.public) return;
  if (b.preview) return;

  b.preview = await generateBoardPreview();
  saveBoardsIndex(index);
  
}



// ======================
// TŁO
// ======================


async function applyBoardBackground() {
  // reset
  bgLayer.style.background = "none";
  bgLayer.style.backgroundImage = "none";
  bgLayer.style.backgroundSize = "100% 100%";

  // 🧹 zwolnij poprzedni URL tła
  if (bgImageUrl) {
    URL.revokeObjectURL(bgImageUrl);
    bgImageUrl = null;
  }

  if (boardBackground.type === "solid") {
    bgLayer.style.background = boardBackground.color;
    return;
  }

  if (boardBackground.type === "gradient") {
    const g = boardBackground.gradient;
    bgLayer.style.background =
      `linear-gradient(${g.direction}, ${g.from}, ${g.to})`;
    return;
  }

  if (boardBackground.type === "image" && boardBackground.imageId) {
    const blob = await getImage(boardBackground.imageId);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    bgImageUrl = url;

    bgLayer.style.backgroundImage = `url(${url})`;
    bgLayer.style.backgroundSize =
      boardBackground.imageFit === "contain" ? "contain" : "cover";
    bgLayer.style.backgroundRepeat =
      boardBackground.imageFit === "repeat" ? "repeat" : "no-repeat";
    bgLayer.style.backgroundPosition = "center";
  }
}
function resetView() {
  boardScale = 1;

  boardOffsetX = 0;
  boardOffsetY = 0;

  applyZoom();
}

function createBoard(name = "Nowy board") {
  const id = "board_" + Date.now();
  const index = loadBoardsIndex();

 // przy tworzeniu boarda
index.boards.push({
  id,
  name,
  updated: Date.now(),
  public: false,

  // ⬇⬇⬇ NOWE
  meta: {
    description: "",
    tags: [],
    categories: []
  }
});

  index.activeBoardId = id;
  saveBoardsIndex(index);

  boardItems = [];
  boardBackground = { ...boardBackground, type: "solid" };
  saveBoard();
  loadBoard(id);
}

function switchBoard(id) {

  saveBoard(); // ← najpierw zapisz aktualny board

  const index = loadBoardsIndex();
  index.activeBoardId = id;
  saveBoardsIndex(index);

  loadBoard(id);
}

async function exportBoardToPNG() {
  const canvas = await html2canvas(board, {
    backgroundColor: null,
    scale: 2
  });

  const link = document.createElement("a");
  link.download = "board.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}



function renameBoard(id, newName) {
  const index = loadBoardsIndex();
  const b = index.boards.find(b => b.id === id);
  if (!b) return;

  b.name = newName;
  b.updated = Date.now();
  saveBoardsIndex(index);
  syncBoardToSupabase(b);
}

async function deleteBoard(id) {
  const index = loadBoardsIndex();

  if (index.boards.length <= 1) {
    alert("Musi istnieć przynajmniej jeden board.");
    return;
  }

  index.boards = index.boards.filter(b => b.id !== id);

  await window.supabaseClient
    .from("boards")
    .delete()
    .eq("id", id);

  localStorage.removeItem("board:" + id);

  if (index.activeBoardId === id) {
    index.activeBoardId = index.boards[0].id;
  }

  saveBoardsIndex(index);
}


// ======================
// TOOLBAR
// ======================

function updateToolbar() {
  if (!selectedItem) {
    toolbar.classList.add("hidden");
    return;
  }

  toolbar.classList.remove("hidden");

  btnShape.style.display =
    selectedItem.type === "image" ? "inline-block" : "none";

  btnBold.style.display =
  btnItalic.style.display =
  btnAlignLeft.style.display =
  btnAlignCenter.style.display =
  btnAlignRight.style.display =
  btnTextBg.style.display =
  bgOpacityInput.style.display =
  fontSelect.style.display =
  fontSizeInput.style.display =
  textColorInput.style.display =
    selectedItem.type === "text" ? "inline-block" : "none";

  btnLock.textContent = selectedItem.locked ? "🔓" : "🔒";

  if (selectedItem.type === "text") {
    fontSizeInput.value = selectedItem.fontSize;
    fontSelect.value = selectedItem.fontFamily;
    textColorInput.value = selectedItem.color;
    bgOpacityInput.value = Math.round(
      (selectedItem.backgroundOpacity ?? 0.85) * 100
    );
  }
}

// ======================
// RENDER
// ======================

function renderBoard() {
 boardInner.querySelectorAll(".board-item").forEach(el => el.remove());


  boardItems.forEach(item => {
    const el = document.createElement("div");
    el.className = "board-item";
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.width + "px";
    el.style.height = item.height + "px";
    el.style.zIndex = item.z;

    const r = item.rotation || 0;
    const sx = item.flipX ? -1 : 1;
    const sy = item.flipY ? -1 : 1;
    el.style.transform = `rotate(${r}deg) scale(${sx},${sy})`;

    if (item === selectedItem) el.classList.add("selected");
    if (item.locked) el.classList.add("locked");

    if (item.type === "image") {
  el.classList.add("shape-" + item.shape);

  const img = document.createElement("img");
  img.draggable = false;
  el.appendChild(img);

  getImage(item.imageId).then(blob => {
  if (!blob) return;

  let url = imageUrlCache.get(item.imageId);
  if (!url) {
    url = URL.createObjectURL(blob);
    imageUrlCache.set(item.imageId, url);
  }

  img.src = url;
});

}


    // TEXT
    if (item.type === "text") {
      el.classList.add("board-text");
      el.textContent = item.text;
      el.style.fontSize = item.fontSize + "px";
      el.style.fontFamily = item.fontFamily;
      el.style.color = item.color;
      el.style.fontWeight = item.bold ? "700" : "400";
      el.style.fontStyle = item.italic ? "italic" : "normal";
      el.style.textAlign = item.align;

      el.style.background = item.backgroundEnabled
        ? `rgba(255,255,255,${item.backgroundOpacity})`
        : "transparent";

    el.addEventListener("click", e => {
  if (item.locked) return;

  e.stopPropagation();

  el.contentEditable = true;
  el.focus();
});


      el.addEventListener("blur", () => {
        el.contentEditable = false;
        item.text = el.textContent;
        saveBoard();
      });
    }

    // SELECT / DRAG
    el.addEventListener("mousedown", e => {
      e.stopPropagation();
      selectedItem = item;
      updateToolbar();
      

      if (item.locked) return;

      draggingItem = item;
      offsetX = e.clientX / boardScale - item.x;
      offsetY = e.clientY / boardScale - item.y;
    });

    // RESIZE
    if (item === selectedItem && !item.locked) {
      const h = document.createElement("div");
      h.className = "resize-handle";
      h.addEventListener("mousedown", e => {
        e.stopPropagation();
        resizingItem = item;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = item.width;
        startHeight = item.height;
      });
      el.appendChild(h);
    }

    boardInner.appendChild(el);
  });
}

// ======================
// DODAWANIE
// ======================
function renderBoardsList() {
  const index = loadBoardsIndex();

  boardSelect.innerHTML = "";

  index.boards
    .sort((a, b) => b.updated - a.updated)
    .forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.public ? `🌍 ${b.name}` : `🔒 ${b.name}`;

      if (b.id === index.activeBoardId) opt.selected = true;
      boardSelect.appendChild(opt);
    });
}
boardSelect.onchange = () => {
  switchBoard(boardSelect.value);
  renderBoardsList();
};
btnNewBoard.onclick = () => {
  const name = prompt("Nazwa boardu:", "Nowy board");
  if (!name) return;

  createBoard(name);
  renderBoardsList();
};
btnExportBoard.onclick = () => {
  exportBoardToPNG();
};

async function generateBoardPreview() {
  const canvas = await html2canvas(board, {
    backgroundColor: null,
    scale: 0.25
  });

  return canvas.toDataURL("image/jpeg", 0.6);
}

async function addImage(file) {

  const imageId = "img_" + Date.now();
  await saveImage(imageId, file);

  let storagePath = null;

  // 🔽 upload tylko jeśli board jest publiczny
  const index = loadBoardsIndex();
  const b = index.boards.find(b => b.id === activeBoardId);

  if (b?.public) {
    storagePath = await uploadImageToStorage(file, activeBoardId);
  }

  const maxZ = Math.max(0, ...boardItems.map(i => i.z || 0));

  boardItems.push({
    id: Date.now(),
    type: "image",
    imageId,
    storagePath,   // ⬅⬅⬅ nowa właściwość
    x: 100,
    y: 100,
    width: 240,
    height: 180,
    shape: "round",
    rotation: 0,
    flipX: false,
    flipY: false,
    locked: false,
    z: maxZ + 1
  });

  saveBoard();
  renderBoard();
}




boardImageInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  addImage(file);
  boardImageInput.value = "";
});


addTextBtn.addEventListener("click", () => {
  textInsertMode = true;
  board.style.cursor = "text";
});


 

// ======================
// TOOLBAR ACTIONS
// ======================

btnDelete.onclick = async () => {
  if (!selectedItem) return;

  if (selectedItem.type === "image") {
    await deleteImage(selectedItem.imageId);

    const url = imageUrlCache.get(selectedItem.imageId);
    if (url) {
      URL.revokeObjectURL(url);
      imageUrlCache.delete(selectedItem.imageId);
    }
  }

  boardItems = boardItems.filter(i => i !== selectedItem);
  selectedItem = null;

  saveBoard();
  renderBoard();
  updateToolbar();
};


btnUp.onclick = () => {
  selectedItem.z = Math.max(...boardItems.map(i => i.z || 0)) + 1;
  saveBoard();
  renderBoard();
};

btnDown.onclick = () => {
  selectedItem.z = Math.min(...boardItems.map(i => i.z || 0)) - 1;
  saveBoard();
  renderBoard();
};

btnShape.onclick = () => {
  if (selectedItem.type !== "image") return;
  selectedItem.shape = nextShape(selectedItem.shape);
  saveBoard();
  renderBoard();
};

btnRotateLeft.onclick = () => {
  if (selectedItem.locked) return;
  selectedItem.rotation -= 15;
  saveBoard();
  renderBoard();
};

btnRotateRight.onclick = () => {
  if (selectedItem.locked) return;
  selectedItem.rotation += 15;
  saveBoard();
  renderBoard();
};

btnFlipX.onclick = () => {
  selectedItem.flipX = !selectedItem.flipX;
  saveBoard();
  renderBoard();
};

btnFlipY.onclick = () => {
  selectedItem.flipY = !selectedItem.flipY;
  saveBoard();
  renderBoard();
};

btnLock.onclick = () => {
  selectedItem.locked = !selectedItem.locked;
  saveBoard();
  renderBoard();
  updateToolbar();
};

btnBold.onclick = () => {
  selectedItem.bold = !selectedItem.bold;
  saveBoard();
  renderBoard();
};

btnItalic.onclick = () => {
  selectedItem.italic = !selectedItem.italic;
  saveBoard();
  renderBoard();
};

btnAlignLeft.onclick = () => {
  selectedItem.align = "left";
  saveBoard();
  renderBoard();
};

btnAlignCenter.onclick = () => {
  selectedItem.align = "center";
  saveBoard();
  renderBoard();
};

btnAlignRight.onclick = () => {
  selectedItem.align = "right";
  saveBoard();
  renderBoard();
};

fontSizeInput.oninput = () => {
  selectedItem.fontSize = Number(fontSizeInput.value);
  saveBoard();
  renderBoard();
};

fontSelect.onchange = () => {
  selectedItem.fontFamily = fontSelect.value;
  saveBoard();
  renderBoard();
};

textColorInput.oninput = () => {
  selectedItem.color = textColorInput.value;
  saveBoard();
  renderBoard();
};

btnTextBg.onclick = () => {
  selectedItem.backgroundEnabled = !selectedItem.backgroundEnabled;
  saveBoard();
  renderBoard();
};

bgOpacityInput.oninput = () => {
  selectedItem.backgroundOpacity = bgOpacityInput.value / 100;
  saveBoard();
  renderBoard();
};

btnGradient.onclick = () => {
  boardBackground.type = "gradient";
  boardBackground.gradient = {
    from: gradientFrom.value,
    to: gradientTo.value,
    direction: gradientDirection.value
  };
  saveBoard();
  applyBoardBackground();
};

btnSolid.onclick = () => {
  boardBackground.type = "solid";
  boardBackground.color = gradientFrom.value;
  saveBoard();
  applyBoardBackground();
};

// ======================
// MYSZ
// ======================

document.getElementById("goToProfile").onclick = () => {
  saveBoard(); // bezpieczeństwo
  window.location.href = "../profil/profile.html";
};


document.addEventListener("mousemove", e => {
	


  
  if (isRightPanning) {
  boardOffsetX += (e.clientX - rightPanStartX) * 0.6;
  boardOffsetY += (e.clientY - rightPanStartY) * 0.6;

  rightPanStartX = e.clientX;
  rightPanStartY = e.clientY;

  applyZoom();
  return;
}


if (resizingItem) {

  let newWidth =
    Math.max(40, startWidth + (e.clientX - startX) / boardScale);

  let newHeight =
    Math.max(40, startHeight + (e.clientY - startY) / boardScale);

  // 🔒 ograniczenie do krawędzi
  newWidth = Math.min(newWidth, 1920 - resizingItem.x);
  newHeight = Math.min(newHeight, 1080 - resizingItem.y);

  resizingItem.width = newWidth;
  resizingItem.height = newHeight;

  renderBoard();
}
if (draggingItem) {

  let newX = e.clientX / boardScale - offsetX;
  let newY = e.clientY / boardScale - offsetY;

  // 🔒 ograniczenia do boarda
  newX = Math.max(0, Math.min(1920 - draggingItem.width, newX));
  newY = Math.max(0, Math.min(1080 - draggingItem.height, newY));

  draggingItem.x = newX;
  draggingItem.y = newY;

  renderBoard();
}
});


document.addEventListener("mouseup", () => {
  if (draggingItem || resizingItem) {
    draggingItem = null;
    resizingItem = null;
    saveBoard();
  }


  if (isRightPanning) {
    isRightPanning = false;
    board.style.cursor = "default";
  }
});
board.addEventListener("mousedown", e => {
  if (!textInsertMode) return;
  if (e.button !== 0) return; // tylko lewy klik

  // nie wstawiaj na istniejący element
  if (e.target.closest(".board-item")) return;

  const rect = board.getBoundingClientRect();

  let x =
  (e.clientX - rect.left - boardOffsetX) / boardScale;

let y =
  (e.clientY - rect.top - boardOffsetY) / boardScale;

x = Math.max(0, Math.min(1920 - 200, x));
y = Math.max(0, Math.min(1080 - 50, y));

  const maxZ = Math.max(0, ...boardItems.map(i => i.z || 0));

  const item = {
    id: Date.now(),
    type: "text",
    text: "",
    x,
    y,
    width: 200,
    height: 50,
    rotation: 0,
    flipX: false,
    flipY: false,
    locked: false,
    z: maxZ + 1,
    fontSize: 16,
    fontFamily: "system-ui",
    color: "#000000",
    bold: false,
    italic: false,
    align: "left",
    backgroundEnabled: true,
    backgroundOpacity: 0.85
  };

  boardItems.push(item);
  selectedItem = item;

  textInsertMode = false;
  board.style.cursor = "default";

  renderBoard();
  updateToolbar();

  // focus na nowy tekst
  requestAnimationFrame(() => {
    const els = boardInner.querySelectorAll(".board-item");
    const el = els[els.length - 1];
    if (!el) return;

    el.contentEditable = true;
    el.focus();
  });
});

board.addEventListener("contextmenu", e => e.preventDefault());


board.addEventListener("wheel", e => {
  e.preventDefault();

  // 🔍 ZOOM
  if (e.ctrlKey) {
    const rect = board.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - boardOffsetX) / boardScale;
    const worldY = (mouseY - boardOffsetY) / boardScale;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, boardScale + delta)
    );

    boardOffsetX = mouseX - worldX * newScale;
    boardOffsetY = mouseY - worldY * newScale;

    boardScale = newScale;
    applyZoom();
    return;
  }

  // ✋ PAN
  boardOffsetX -= e.deltaX;
  boardOffsetY -= e.deltaY;

  applyZoom();
}, { passive: false });



function zoomToCenter(delta) {
  const rect = board.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  const worldX = (centerX - boardOffsetX) / boardScale;
  const worldY = (centerY - boardOffsetY) / boardScale;

  const newScale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, boardScale + delta)
  );

  boardOffsetX = centerX - worldX * newScale;
  boardOffsetY = centerY - worldY * newScale;

  boardScale = newScale;
  applyZoom();
}

btnZoomIn.onclick = () => zoomToCenter(+0.1);
btnZoomOut.onclick = () => zoomToCenter(-0.1);




board.addEventListener("mousedown", e => {
  if (e.button !== 2) return; // tylko prawy przycisk

  e.preventDefault();
  isRightPanning = true;
  rightPanStartX = e.clientX;
  rightPanStartY = e.clientY;

  board.style.cursor = "grabbing";
});



btnRemoveBgImage.onclick = async () => {
  if (boardBackground.type === "image" && boardBackground.imageId) {
    await deleteImage(boardBackground.imageId);
  }

  boardBackground.type = "solid";
  boardBackground.imageId = null;

  saveBoard();
  applyBoardBackground();
};


// ======================
// ODKLIK
// ======================

document.addEventListener("mousedown", e => {
  if (!e.target.closest(".board-item") &&
      !e.target.closest(".board-toolbar")) {
    selectedItem = null;
    updateToolbar();
    renderBoard();
  }
});

// ======================
// START
// ======================

(async () => {
  await migrateBoardToIndexedDB();

 const forcedBoard = localStorage.getItem("openBoard");

const index = loadBoardsIndex();
activeBoardId = forcedBoard || index.activeBoardId;

localStorage.removeItem("openBoard");

  loadBoard(activeBoardId);
  renderBoardsList();
})();


