// =======================
// HOME – public boards feed
// =======================

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =======================
// BOOKMARK ICON
// =======================

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
    ownerAvatar: b.profiles?.avatar || null
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
// FETCH OPPORTUNITIES
// =======================

async function getLatestOpportunities(){

  const { data, error } = await supabaseClient
  .from("jobs")
  .select(`
    id,
    title,
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

// =======================
// RENDER OPPORTUNITIES ROW
// =======================

async function renderOpportunitiesRow(){

  const container = document.getElementById("opportunitiesRow")

  if(!container) return

  const opportunities = await getLatestOpportunities()

  opportunities.forEach(job => {

    const pill = document.createElement("div")

    pill.className = "opportunity-pill"

    const handle = job.profiles?.handle

    pill.textContent =
      handle
        ? `${job.title} · @${handle}`
        : job.title

    pill.onclick = () => {

      window.location.href =
        "../opportunities/opportunities.html"

    }

    container.appendChild(pill)

  })

}
// =======================
// RENDER HOME FEED
// =======================

async function renderHomeFeed() {

  const list = document.getElementById("homeFeed");

  if (!list) return;

  list.innerHTML = "";

  const feed = await getPublicBoardsFeed();
  const bookmarks = await getUserBookmarks();


  if (feed.length === 0) {

    const empty = document.createElement("div");
    empty.className = "home-empty";
    empty.textContent = "Brak publicznych projektów.";

    list.appendChild(empty);

    return;
  }


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


// =======================
// START
// =======================

document.addEventListener("DOMContentLoaded", () => {

  renderOpportunitiesRow()

  renderHomeFeed()

});