// =======================
// SAVED BOARDS FEED
// =======================

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// =======================
// ICON
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

  path.setAttribute("fill", "currentColor");

  svg.appendChild(path);

  return svg;
}


// =======================
// USER
// =======================

async function getCurrentUserId() {

  const { data } = await supabaseClient.auth.getUser();

  return data?.user?.id || null;
}


// =======================
// FETCH SAVED BOARDS
// =======================

async function getSavedBoards() {

  const userId = await getCurrentUserId();

  if (!userId) return [];

  const { data, error } = await supabaseClient
    .from("bookmarks")
    .select(`
      board_id,
      boards (
        id,
        name,
        preview,
        updated_at,
        profiles:owner_id (
          handle,
          name,
          avatar
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });


  if (error) {

    console.error(error);
    return [];
  }


  return data.map(row => {

    const b = row.boards;

    return {

      boardId: b.id,
      boardName: b.name,
      preview: b.preview,
      ownerHandle: b.profiles?.handle,
      ownerName: b.profiles?.name,
      ownerAvatar: b.profiles?.avatar

    };

  });

}


// =======================
// REMOVE BOOKMARK
// =======================

async function removeBookmark(boardId) {

  const userId = await getCurrentUserId();

  if (!userId) return;

  await supabaseClient
    .from("bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("board_id", boardId);

}


// =======================
// RENDER
// =======================

async function renderSavedFeed() {

  const list = document.getElementById("savedGrid");

  if (!list) return;

  list.innerHTML = "";

  const boards = await getSavedBoards();


  if (boards.length === 0) {

    const empty = document.createElement("div");

    empty.className = "home-empty";
    empty.textContent = "Nie masz jeszcze zapisanych projektów.";

    list.appendChild(empty);

    return;
  }


  boards.forEach(item => {

    const li = document.createElement("li");

    li.className = "project-card";

    li.onclick = () => {

      window.location.href =
        `../whiteboard/public.html?id=${item.boardId}`;
    };


    // preview

    if (item.preview) {

      const img = document.createElement("img");

      img.className = "home-board-preview";
      img.src = item.preview;

      li.appendChild(img);
    }


    // header

    const header = document.createElement("div");

    header.className = "home-board-header";


    const title = document.createElement("div");

    title.className = "home-board-title";
    title.textContent = item.boardName;


    const bookmark = document.createElement("div");

    bookmark.className = "bookmark-btn";

    bookmark.appendChild(createBookmarkIcon(true));


    bookmark.onclick = async e => {

      e.stopPropagation();

      await removeBookmark(item.boardId);

      li.remove();
    };


    header.appendChild(title);
    header.appendChild(bookmark);


    // author

    const author = document.createElement("div");

    author.className = "home-board-author";


    if (item.ownerAvatar) {

      const avatar = document.createElement("img");

      avatar.className = "home-board-avatar";
      avatar.src = item.ownerAvatar;

      author.appendChild(avatar);
    }


    const name = document.createElement("span");

    name.textContent =
      item.ownerHandle
        ? "@" + item.ownerHandle
        : item.ownerName;

    author.appendChild(name);


    li.appendChild(header);
    li.appendChild(author);

    list.appendChild(li);

  });

}


// =======================
// START
// =======================

document.addEventListener("DOMContentLoaded", () => {

  renderSavedFeed();

});
