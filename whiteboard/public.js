let CURRENT_USER_ID = null;

async function loadCurrentUser() {

  const { data } =
    await supabaseClient.auth.getUser();

  CURRENT_USER_ID = data?.user?.id || null;

}

const IS_PUBLIC_VIEW = true;

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params = new URLSearchParams(location.search);
const boardId = params.get("id");

if (!boardId) {
  document.body.textContent = "Brak ID projektu.";
  throw new Error("no board id");
}

/* ====== stan jak w Twoim whiteboardzie ====== */

let boardItems = [];
let boardBackground = null;

let boardScale = 1;
let boardOffsetX = 0;
let boardOffsetY = 0;

const board = document.getElementById("board");
const boardInner = document.getElementById("boardInner");
const bgLayer = document.getElementById("boardBackgroundLayer");

/* ====== start ====== */

init();

async function init() {

  await loadCurrentUser();

  await loadPublicBoard();

fitBoardToScreen(); // 🔥 DODAJ

  await loadComments();

}
window.addEventListener("resize", fitBoardToScreen);
/* ====== load ====== */

async function loadPublicBoard() {

  const { data, error } = await supabaseClient
    .from("boards")
    .select(`
  name,
  content,
  public,
  meta,
  owner_id,
  profiles (
    handle,
    avatar
  )
`)
    .eq("id", boardId)
    .eq("public", true)
    .single();

  if (error || !data || !data.content) {
    document.body.textContent = "Ten projekt nie jest publiczny.";
    return;
  }

  document.title = data.name;
renderProjectMeta(data);
  boardItems = data.content.items || [];
  boardBackground = data.content.background || null;

  await applyBoardBackground();
  renderBoard();
}

function renderProjectMeta(data) {

  const container = document.getElementById("projectMeta");

  const meta = data.meta || {};
  const handle = data.profiles?.handle || "user";
  const avatar = data.profiles?.avatar || "../assets/default-avatar.png";

  container.innerHTML = `

    <div class="project-header">

      <img class="project-avatar" src="${avatar}">

      <div class="project-author" data-handle="${handle}">
  @${handle}
</div>

    </div>

    ${meta.description ? `
      <div class="project-description">
        ${meta.description}
      </div>
    ` : ""}

    ${meta.categories?.length ? `
  <div class="project-section project-categories">
        ${meta.categories.map(c => `
  <span class="category-pill" onclick="goToCategory('${c}')">
    ${c}
  </span>
`).join("")}
      </div>
    ` : ""}

    ${meta.tags?.length ? `
  <div class="project-section project-tags">
        ${meta.tags.map(t => `
  <span class="tag-pill" onclick="goToTag('${t}')">
    #${t}
  </span>
`).join("")}
      </div>
    ` : ""}

  `;
  const authorEl = container.querySelector(".project-author");

authorEl.onclick = () => {
  window.location.href =
    `../public/public-profile.html?handle=${handle}`;
};
}
/* ====== TŁO – prawie 1:1 z Twojego kodu ====== */

async function applyBoardBackground() {

  bgLayer.style.background = "none";
  bgLayer.style.backgroundImage = "none";

  if (!boardBackground) return;

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

  if (
  boardBackground.type === "image" &&
  boardBackground.storagePath
) {
  const { data } = supabaseClient
    .storage
    .from("board-images")
    .getPublicUrl(boardBackground.storagePath);

  bgLayer.style.backgroundImage = `url(${data.publicUrl})`;
  bgLayer.style.backgroundRepeat = "no-repeat";
  bgLayer.style.backgroundPosition = "center";

  bgLayer.style.backgroundSize =
    boardBackground.imageFit === "contain"
      ? "contain"
      : "cover";

  return;
}

}

/* ====== RENDER – wersja tylko do oglądania ====== */

function renderBoard() {

  boardInner.querySelectorAll(".board-item").forEach(el => el.remove());

  boardItems.forEach(item => {

    const el = document.createElement("div");
    el.className = "board-item";
    if (item.type === "image" && item.shape) {
  el.classList.add("shape-" + item.shape);
}

    el.style.position = "absolute";
    el.style.left = item.x + "px";
    el.style.top = item.y + "px";
    el.style.width = item.width + "px";
    el.style.height = item.height + "px";
    el.style.zIndex = item.z;

    const r = item.rotation || 0;
    const sx = item.flipX ? -1 : 1;
    const sy = item.flipY ? -1 : 1;
    el.style.transform = `rotate(${r}deg) scale(${sx},${sy})`;

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
    }

   if (item.type === "image" && item.storagePath) {

  const { data } = supabaseClient
    .storage
    .from("board-images")
    .getPublicUrl(item.storagePath);

const img = document.createElement("img");
img.src = data.publicUrl;
img.draggable = false;

img.style.width = "100%";
img.style.height = "100%";
img.style.objectFit = "cover";

el.appendChild(img);

}


    boardInner.appendChild(el);
  });
}



document
  .getElementById("commentForm")
  .addEventListener("submit", async e => {

    e.preventDefault();

    const input =
      document.getElementById("commentInput");

    const content = input.value.trim();

    if (!content) return;

    const { data } =
      await supabaseClient.auth.getUser();

    if (!data.user) return;

    await supabaseClient
      .from("comments")
      .insert({

        board_id: boardId,

        user_id: data.user.id,

        content

      });

    input.value = "";

  

});

async function loadComments() {

  const list =
    document.getElementById("commentsList");

  list.innerHTML = "";

  const { data } =
    await supabaseClient
      .from("comments")
    .select(`
  id,
  user_id,
  content,
  created_at,
  profiles (
    handle,
    avatar
  )
`)
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

  data.forEach(c => {

    const div =
      document.createElement("div");

    div.className = "comment";

const avatarUrl =
  c.profiles?.avatar || "../assets/default-avatar.png";

const handle =
  c.profiles?.handle || "user";

const isOwner =
  c.user_id === CURRENT_USER_ID;

div.innerHTML = `

  <div class="comment-row">

    <img
      class="comment-avatar"
      src="${avatarUrl}"
    >

    <div class="comment-body">

      <div class="comment-header">

        <div class="comment-author" data-handle="${handle}">
  @${handle}
</div>

        ${
          isOwner
            ? `<div class="comment-delete" data-id="${c.id}">🗑</div>`
            : ""
        }

      </div>

      <div class="comment-text">
        ${c.content}
      </div>

    </div>

  </div>

`;

if (isOwner) {

  const deleteBtn =
    div.querySelector(".comment-delete");

  deleteBtn.onclick = async () => {

    if (!confirm("Usunąć komentarz?")) return;

    await supabaseClient
      .from("comments")
      .delete()
      .eq("id", c.id);

    loadComments();

  };

}
const authorName =
  div.querySelector(".comment-author");

authorName.onclick = () => {
  window.location.href =
    `../public/public-profile.html?handle=${handle}`;
};
const avatar =
  div.querySelector(".comment-avatar");

avatar.onclick = () => {

  window.location.href =
    `../public/public-profile.html?handle=${handle}`;

};
    list.appendChild(div);

  });

}

function goToTag(tag) {
  window.location.href = `../home/home.html?tag=${encodeURIComponent(tag)}`;
}

function goToCategory(category) {
  window.location.href = `../home/home.html?category=${encodeURIComponent(category)}`;
}
function fitBoardToScreen() {

  const rect = board.getBoundingClientRect();

  const scaleX = rect.width / 1920;
  const scaleY = rect.height / 1080;

  const scale = Math.min(scaleX, scaleY);

  const offsetX = (rect.width - 1920 * scale) / 2;
  const offsetY = (rect.height - 1080 * scale) / 2;

  boardInner.style.transform =
    `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}