/* =======================
   SUPABASE INIT
======================= */

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =======================
   USER ID
======================= */

function getOrCreateUserId() {
    let id = localStorage.getItem("userId");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("userId", id);
    }
    return id;
}
const handleInput = document.getElementById("handleInput");
const userHandle  = document.getElementById("userHandle");

/* =======================
   ELEMENTY
======================= */
const viewMode = document.getElementById("viewMode");
const editMode = document.getElementById("editMode");

const editBtn = document.getElementById("editProfileBtn");

const cancelBtn = document.getElementById("cancelBtn");

const username = document.getElementById("username");
const bio = document.getElementById("bio");
const avatar = document.getElementById("avatar");

const nameInput = document.getElementById("nameInput");
const bioInput = document.getElementById("bioInput");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");

let avatarBase64 = null;

/* =======================
   UPLOAD AVATARA
======================= */
avatarInput.addEventListener("change", () => {
    const file = avatarInput.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Wybierz plik graficzny");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Maksymalny rozmiar avatara to 2MB");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        avatarBase64 = reader.result;
        avatarPreview.src = avatarBase64;
        avatarPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});

/* =======================
   WCZYTYWANIE PROFILU
======================= */
async function loadProfile() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (!error && data.user) {

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile) {
      localStorage.setItem("profile", JSON.stringify(profile));
      applyProfile(profile);
      return;
    }
  }

  // fallback – stary localStorage
  const local = localStorage.getItem("profile");
  if (local) {
    applyProfile(JSON.parse(local));
  }
}
function applyProfile(data) {
  username.textContent = data.name;
  bio.textContent = data.bio;
  avatar.src = data.avatar;

  if (userHandle) {
    userHandle.textContent = data.handle ? "@" + data.handle : "";
  }
}

/* =======================
   TRYB EDYCJI
======================= */
editBtn.addEventListener("click", () => {
    nameInput.value = username.textContent;
    bioInput.value = bio.textContent;
   const raw = localStorage.getItem("profile");
const data = raw ? JSON.parse(raw) : null;
handleInput.value = data?.handle || "";



    avatarPreview.src = avatar.src;
    avatarPreview.classList.remove("hidden");

    viewMode.classList.add("hidden");
    editMode.classList.remove("hidden");
});

/* =======================
   ANULUJ
======================= */
cancelBtn.addEventListener("click", () => {
    avatarBase64 = null;
    avatarPreview.classList.add("hidden");

    editMode.classList.add("hidden");
    viewMode.classList.remove("hidden");
});

/* =======================
   ZAPIS
======================= */

    async function saveProfileToSupabase(profileData) {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) return;

  const userId = data.user.id;

  const { error: upsertError } = await supabaseClient
    .from("profiles")
    .upsert({
      id: userId,
      name: profileData.name,
      handle: profileData.handle,
      bio: profileData.bio,
      avatar: profileData.avatar,
      updated_at: new Date().toISOString()
    });

  if (upsertError) {
    console.error("Profile supabase save error:", upsertError);
  }
}
editMode.addEventListener("submit", async (e) => {
    e.preventDefault();

    const profileData = {
  id: getOrCreateUserId(), // lokalne – tylko cache
  name: nameInput.value,
  bio: bioInput.value,
  handle: handleInput.value.trim().replace(/^@/, ""),
  avatar: avatarBase64 || avatar.src
};

localStorage.setItem("profile", JSON.stringify(profileData));
await saveProfileToSupabase(profileData);



    avatarBase64 = null;
    loadProfile();

    editMode.classList.add("hidden");
    viewMode.classList.remove("hidden");
    

});

/* =======================
   LISTA PROJEKTÓW
======================= */

let draggedItem = null;

function loadUserBoards() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const indexKey = `boards:index:${userId}`;
  const raw = localStorage.getItem(indexKey);
  if (!raw) return;

  const index = JSON.parse(raw);
  const list = document.getElementById("projectsList");
  if (!list) return;

  list.innerHTML = "";

  // ➕ Nowy projekt
  const newTile = document.createElement("li");
  newTile.className = "project-card project-new";
  newTile.textContent = "+ Nowy projekt";
  newTile.onclick = () => {
    window.location.href = "../whiteboard/whiteboard.html";
  };
  list.appendChild(newTile);

  // 📁 Istniejące projekty
  index.boards.forEach(board => {

    // migracja
    if (typeof board.public !== "boolean") board.public = false;
    if (typeof board.pinned !== "boolean") board.pinned = false;
    if (!("preview" in board)) board.preview = null;

    const li = document.createElement("li");
    li.className = "project-card";
    li.dataset.id = board.id;
    li.draggable = !board.pinned;
    const preview = document.createElement("img");
preview.className = "project-preview";
preview.loading = "lazy";

if (board.preview) {
  preview.src = board.preview;
} else {
  preview.classList.add("no-preview");
}

li.appendChild(preview);



    // ---------------- drag & drop ----------------

    li.addEventListener("dragstart", () => {
      draggedItem = li;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      draggedItem = null;
      saveNewOrder();
    });

    li.addEventListener("dragover", (e) => {
      e.preventDefault();

      const dragging = draggedItem;
      if (!dragging || dragging === li) return;

      const rect = li.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;

      if (after) {
        list.insertBefore(dragging, li.nextSibling);
      } else {
        list.insertBefore(dragging, li);
      }
    });

    // ---------------- klik kafelka ----------------

    li.onclick = () => {
      localStorage.setItem("openBoard", board.id);
      window.location.href = "../whiteboard/whiteboard.html";
    };

    const name = document.createElement("div");
    name.className = "project-name";
    name.textContent = board.name;

    const meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent =
      "Ostatnia edycja: " +
      new Date(board.updated).toLocaleDateString();

    // ---------------- pin ----------------

    const pin = document.createElement("span");
    pin.className = "project-pin";
    pin.textContent = board.pinned ? "📌" : "📍";
    pin.title = board.pinned
      ? "Odepnij projekt"
      : "Przypnij projekt na górze listy";

    pin.onclick = (e) => {
      e.stopPropagation();

      board.pinned = !board.pinned;

      moveBoardAfterPinChange(board);
      loadUserBoards();
    };

    // ---------------- visibility ----------------

    const visibility = document.createElement("span");
    visibility.className = "project-visibility";
    visibility.textContent = board.public ? "🌍" : "🔒";
    visibility.title = board.public
      ? "Projekt publiczny – kliknij aby ustawić jako prywatny"
      : "Projekt prywatny – kliknij aby ustawić jako publiczny";

    visibility.onclick = async (e) => {
      e.stopPropagation();

      board.public = !board.public;
      board.updated = Date.now();

      visibility.textContent = board.public ? "🌍" : "🔒";

      localStorage.setItem(indexKey, JSON.stringify(index));

      await syncBoardToSupabase(board);
    };

    const del = document.createElement("span");
del.className = "project-delete";
del.textContent = "🗑️";
del.title = "Usuń projekt";

del.onclick = async (e) => {
  e.stopPropagation();

  if (!confirm(`Usunąć projekt "${board.name}"?`)) return;

  deleteBoardFromProfile(board.id);
};

const header = document.createElement("div");
header.className = "project-header";
header.appendChild(name);
header.appendChild(pin);
header.appendChild(visibility);
header.appendChild(del);


    li.appendChild(header);
    li.appendChild(meta);
    list.appendChild(li);
  });
}

function moveBoardAfterPinChange(board) {

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const indexKey = `boards:index:${userId}`;
  const raw = localStorage.getItem(indexKey);
  if (!raw) return;

  const index = JSON.parse(raw);

  const rest = index.boards.filter(b => b.id !== board.id);

  if (board.pinned) {
    index.boards = [board, ...rest];
  } else {
    index.boards = [...rest, board];
  }

  localStorage.setItem(indexKey, JSON.stringify(index));
}

function saveNewOrder() {

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const indexKey = `boards:index:${userId}`;
  const raw = localStorage.getItem(indexKey);
  if (!raw) return;

  const index = JSON.parse(raw);
  const list = document.getElementById("projectsList");
  if (!list) return;

  const ids = [...list.querySelectorAll(".project-card")]
    .filter(el => !el.classList.contains("project-new"))
    .map(el => el.dataset.id);

  const pinned = index.boards.filter(b => b.pinned);
  const normal = [];

  ids.forEach(id => {
    const found = index.boards.find(b => b.id === id && !b.pinned);
    if (found) normal.push(found);
  });

  index.boards = [...pinned, ...normal];

  localStorage.setItem(indexKey, JSON.stringify(index));
}






async function syncBoardToSupabase(board) {

  const { data, error: userError } =
    await supabaseClient.auth.getUser();

  if (userError || !data.user) return;

  const userId = data.user.id;

  const { error } = await supabaseClient
    .from("boards")
    .upsert({
      id: board.id,
      name: board.name,
      public: board.public,
      updated_at: new Date(board.updated).toISOString(),
      owner_id: userId,
      preview: board.preview ?? null
    });

  if (error) {
    console.error("Supabase sync error:", error);
  }
}



async function deleteBoardFromProfile(boardId) {

  const userId = localStorage.getItem("userId");
  if (!userId) return;

  const indexKey = `boards:index:${userId}`;
  const raw = localStorage.getItem(indexKey);
  if (!raw) return;

  const index = JSON.parse(raw);

  if (index.boards.length <= 1) {
    alert("Musi istnieć przynajmniej jeden projekt.");
    return;
  }

  // usuń z indexu
  index.boards = index.boards.filter(b => b.id !== boardId);

  localStorage.setItem(indexKey, JSON.stringify(index));

  // usuń dane boardu
  localStorage.removeItem("board:" + boardId);

  // usuń z Supabase
  try {
    await supabaseClient
      .from("boards")
      .delete()
      .eq("id", boardId);
  } catch (e) {
    console.error("Supabase delete error", e);
  }

  loadUserBoards();
}

document
  .getElementById("followingBtn")
  .onclick = () => {

  window.location.href =
    "../profil/following.html";

};

const logoutBtn = document.getElementById("logoutBtn")

if (logoutBtn) {

  logoutBtn.addEventListener("click", async () => {

    const confirmLogout = confirm("Czy na pewno chcesz się wylogować?")

    if (!confirmLogout) {
      return
    }

    const { error } = await supabaseClient.auth.signOut()

    if (error) {
      console.error(error)
      alert("Błąd wylogowania")
      return
    }

    window.location.href = "../login/index.html"

  })

}


/* =======================
   START
======================= */
getOrCreateUserId();
loadProfile();
loadUserBoards();
