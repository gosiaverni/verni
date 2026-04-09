// =======================
// HOME – public boards feed
// =======================

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const params = new URLSearchParams(window.location.search);

const filterTag = params.get("tag");
const filterCategory = params.get("category");

let searchQuery = "";
// =======================
// BOOKMARK ICON
// =======================
function createStarIcon() {

  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");

  const path = document.createElementNS(svgNS, "path");

  path.setAttribute(
    "d",
    "M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21Z"
  );

  // 👇 KLUCZOWA ZMIANA (outline jak bookmark)
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#F28B18");
  path.setAttribute("stroke-width", "2");

  svg.appendChild(path);

  return svg;
}


function createBookmarkIcon(saved) {

  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");

  const path = document.createElementNS(svgNS, "path");

  path.setAttribute(
    "d",
    "M6 2C5.447 2 5 2.447 5 3V22L12 18L19 22V3C19 2.447 18.553 2 18 2H6Z"
  );

  if (saved) {

    path.setAttribute("fill", "currentColor");

  } else {

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
  }

  svg.appendChild(path);

  return svg;
}

function createCommentIcon() {

  const svgNS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(svgNS, "svg");

  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");

  const path = document.createElementNS(svgNS, "path");

  path.setAttribute(
    "d",
    "M21 15a4 4 0 0 1-4 4H8l-5 3V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"
  );

  path.setAttribute("fill", "currentColor");

  svg.appendChild(path);

  return svg;
}
// =======================
// FETCH PUBLIC BOARDS
// =======================

async function getPublicBoardsFeed() {

  const { data, error } = await supabaseClient
    .from("boards")
   .select(`
  id,
  name,
  preview,
  updated_at,
  meta,
  profiles:owner_id (
    id,
    name,
    handle,
    avatar
  )
`)
    .eq("public", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data.map(b => ({
  boardId: b.id,
  boardName: b.name,
  updated: b.updated_at,
  preview: b.preview,
  ownerId: b.profiles?.id,
  ownerHandle: b.profiles?.handle || null,
  ownerName: b.profiles?.name || "Unknown",
  ownerAvatar: b.profiles?.avatar || null,

  // 🔥 NOWE
  meta: b.meta || {}
}));
}


// =======================
// BOOKMARKS LOGIC
// =======================

async function getCurrentUserId() {

  const { data } = await supabaseClient.auth.getUser();
  return data?.user?.id || null;
}


async function getUserBookmarks() {

  const userId = await getCurrentUserId();

  if (!userId) return new Set();

  const { data, error } = await supabaseClient
    .from("bookmarks")
    .select("board_id")
    .eq("user_id", userId);

  if (error) {

    console.error(error);
    return new Set();
  }

  return new Set(data.map(b => b.board_id));
}


async function addBookmark(boardId) {

  const userId = await getCurrentUserId();

  if (!userId) return;

  const { error } = await supabaseClient
    .from("bookmarks")
    .insert({
      user_id: userId,
      board_id: boardId
    });

  if (error) console.error(error);
}


async function removeBookmark(boardId) {

  const userId = await getCurrentUserId();

  if (!userId) return;

  const { error } = await supabaseClient
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("board_id", boardId);

  if (error) console.error(error);
}



// =======================
// RENDER HOME FEED
// =======================


async function renderHomeFeed() {

 const list = document.getElementById("homeFeed");
if (!list) return;

// 🔥 CLEAR FILTER BUTTON
if (filterTag || filterCategory) {
  const clear = document.createElement("div");

  clear.textContent = "← Wróć do wszystkich projektów";
  clear.style.cursor = "pointer";
  clear.style.fontSize = "13px";
  clear.style.color = "#666";
  clear.style.marginBottom = "12px";

  clear.onclick = () => {
    window.location.href = "../home/home.html";
  };

 // usuń poprzedni jeśli istnieje
const old = document.getElementById("clearFilterBtn");
if (old) old.remove();

clear.id = "clearFilterBtn";

list.parentElement.prepend(clear);
}

  if (!list) return;

  list.innerHTML = "";
  const header = document.querySelector(".home-header h1");

if (header) {
  if (filterTag) {
    header.textContent = `#${filterTag}`;
  } else if (filterCategory) {
    header.textContent = filterCategory;
  } else {
    ;
  }
}

  let feed = await getPublicBoardsFeed();
const bookmarks = await getUserBookmarks();

// 🔥 filtr tag
if (filterTag) {
  feed = feed.filter(b =>
    b.meta?.tags?.includes(filterTag)
  );
}

// 🔥 filtr kategoria
if (filterCategory) {
  feed = feed.filter(b =>
    b.meta?.categories?.includes(filterCategory)
  );
}
// 🔍 SEARCH FILTER
if (searchQuery && !filterTag && !filterCategory) {

  const words = searchQuery.split(" ").filter(Boolean);

  const tagFilters = words
    .filter(w => w.startsWith("#"))
    .map(w => w.slice(1));

  const textFilters = words.filter(w => !w.startsWith("#"));

  feed = feed.filter(b => {

    const description = b.meta?.description?.toLowerCase() || "";
    const tags = (b.meta?.tags || []).map(t => t.toLowerCase());
    const categories = (b.meta?.categories || []).join(" ").toLowerCase();
    const handle = (b.ownerHandle || "").toLowerCase();

    // 🔍 tekst
    const matchesText = textFilters.every(word =>
      `${description} ${categories} ${handle}`.includes(word)
    );

    // 🔖 tagi
    const matchesTags = tagFilters.every(tag =>
      tags.includes(tag)
    );

    return matchesText && matchesTags;
  });
}
// 🔥 TERAZ sprawdzenie
if (feed.length === 0) {
  const empty = document.createElement("div");
  empty.className = "home-empty";

  if (filterTag) {
    empty.textContent = `Brak projektów dla #${filterTag}`;
  } else if (filterCategory) {
    empty.textContent = `Brak projektów w kategorii "${filterCategory}"`;
  } else {
    empty.textContent = "Brak publicznych projektów.";
  }

  list.appendChild(empty);
  return;
}
// 🔍 SEARCH FILTER


  feed.forEach(item => {

    const li = document.createElement("li");
    li.className = "project-card";

    li.onclick = () => {

      window.location.href =
        `../whiteboard/public.html?id=${item.boardId}`;
    };


    // PREVIEW IMAGE

    if (item.preview) {

      const img = document.createElement("img");

      img.className = "home-board-preview";
      img.src = item.preview;
      img.loading = "lazy";

      li.appendChild(img);
    }


    // HEADER

    const header = document.createElement("div");
    header.className = "home-board-header";


    // TITLE

    const title = document.createElement("div");

    title.className = "home-board-title";
    title.textContent = item.boardName;


    // BOOKMARK BUTTON

    const bookmark = document.createElement("div");

    bookmark.className = "bookmark-btn";

    bookmark.appendChild(
      createBookmarkIcon(bookmarks.has(item.boardId))
    );


    bookmark.onclick = async e => {

      e.stopPropagation();

      const saved = bookmarks.has(item.boardId);

      if (saved) {

        await removeBookmark(item.boardId);
        bookmarks.delete(item.boardId);

      } else {

        await addBookmark(item.boardId);
        bookmarks.add(item.boardId);
      }

      bookmark.innerHTML = "";

      bookmark.appendChild(
        createBookmarkIcon(!saved)
      );
    };


    const actions = document.createElement("div");
actions.style.display = "flex";
actions.style.gap = "8px";


const commentBtn = document.createElement("div");

commentBtn.className = "comment-btn";

commentBtn.appendChild(createCommentIcon());

commentBtn.onclick = e => {

  e.stopPropagation();

  window.location.href =
    `../whiteboard/public.html?id=${item.boardId}&comments=true`;

};


actions.appendChild(commentBtn);
const reviewBtn = document.createElement("div");

reviewBtn.className = "review-btn";

reviewBtn.appendChild(createStarIcon());

reviewBtn.onclick = e => {

  e.stopPropagation();

  window.location.href =
    `../reviews/write-review.html?boardId=${item.boardId}`;
};

actions.appendChild(commentBtn);
actions.appendChild(reviewBtn); // ⭐ NOWE
actions.appendChild(bookmark);
actions.appendChild(bookmark);

header.appendChild(title);
header.appendChild(actions);


    // AUTHOR

    const author = document.createElement("div");
    author.className = "home-board-author";


    if (item.ownerAvatar) {

      const avatar = document.createElement("img");

      avatar.className = "home-board-avatar";
      avatar.src = item.ownerAvatar;

      author.appendChild(avatar);
    }


    const name = document.createElement("span");

    const displayName =
      item.ownerHandle
        ? "@" + item.ownerHandle
        : item.ownerName;

    name.textContent = displayName;

    name.onclick = e => {

      e.stopPropagation();

      if (!item.ownerHandle) return;

      window.location.href =
        `/public/public-profile.html?handle=${item.ownerHandle}`;
    };


    author.appendChild(name);


    // APPEND

    li.appendChild(header);
    li.appendChild(author);

    list.appendChild(li);

  });

}

async function getLatestReviews(){

  const { data, error } = await supabaseClient
    .from("reviews")
    .select(`
      id,
      title,
      content,
      rating,
      created_at,
      board_id,
      boards:board_id (
        name
      ),
      profiles:user_id (
        handle
      )
    `)
    .order("created_at", { ascending:false })
    .limit(10)

  if(error){
    console.error(error)
    return []
  }

  return data
}

function createStarsDisplay(rating){

  let stars = "";

  for(let i=0;i<5;i++){
    stars += i < rating ? "★" : "☆";
  }

  return stars;
}

async function renderReviewsRow(){

  const container = document.getElementById("reviewsRow")

  if(!container) return

  container.innerHTML = ""

  const reviews = await getLatestReviews()

  reviews.forEach(review => {

    const card = document.createElement("div")

    card.className = "review-card"

    const handle = review.profiles?.handle || "anon"
    const boardName = review.boards?.name || "projekt"

    card.innerHTML = `
      <div class="review-stars">
        ${createStarsDisplay(review.rating)}
      </div>

     <div class="review-title">
  ${review.title || "Bez tytułu"}
</div>

<div class="review-text">
  ${review.content.slice(0, 80)}...
</div>

      <div class="review-meta">
        ${boardName} · @${handle}
      </div>
    `

    card.onclick = () => {
      window.location.href =
        `../whiteboard/public.html?id=${review.board_id}`
    }

    container.appendChild(card)

  })

}



// =======================
// START
// =======================



document.addEventListener("DOMContentLoaded", () => {


  renderHomeFeed();

  const input = document.getElementById("searchInput");

  let searchTimeout;

if (input) {
  input.addEventListener("input", e => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value.toLowerCase();
      renderHomeFeed();
    }, 200);
  });
}
const filterBtn = document.getElementById("filterBtn");
const dropdown = document.getElementById("filterDropdown");

// toggle dropdown
if (filterBtn && dropdown) {
  filterBtn.onclick = () => {
    dropdown.classList.toggle("hidden");
  };
}

// kliknięcie kategorii
document.querySelectorAll(".filter-option").forEach(opt => {

  opt.onclick = () => {

    const category = opt.dataset.category;

    window.location.href =
      `../home/home.html?category=${encodeURIComponent(category)}`;
  };
const active = filterCategory;

document.querySelectorAll(".filter-option").forEach(opt => {
  if (opt.dataset.category === active) {
    opt.style.background = "#f3f3f3";
    opt.style.fontWeight = "600";
  }
});
});
});

document.addEventListener("click", e => {

  if (!dropdown || !filterBtn) return;

  if (
    !dropdown.contains(e.target) &&
    !filterBtn.contains(e.target)
  ) {
    dropdown.classList.add("hidden");
  }

});
renderReviewsRow();