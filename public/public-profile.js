let PROFILE_USER_ID = null;
let CURRENT_USER_ID = null;

const avatarEl = document.getElementById("avatar");
const usernameEl = document.getElementById("username");
const handleEl = document.getElementById("userHandle");
const bioEl = document.getElementById("bio");
const projectsList = document.getElementById("projectsList");

const followBtn = document.getElementById("followBtn");

init();

async function init() {

  await loadCurrentUser();

  const params = new URLSearchParams(location.search);
  const handle = params.get("handle");

  if (!handle) {
    alert("Brak handle w adresie URL");
    return;
  }

  await loadPublicProfile(handle);

}

async function loadCurrentUser() {

  const { data } =
    await supabaseClient.auth.getUser();

  CURRENT_USER_ID =
    data?.user?.id || null;

}

async function loadPublicProfile(handle) {

  const { data: profiles, error } =
    await supabaseClient
      .from("profiles")
      .select("*")
      .eq("handle", handle)
      .limit(1);

  if (error || !profiles?.length) {

    alert("Nie znaleziono profilu");
    return;

  }

  const profile = profiles[0];

  PROFILE_USER_ID = profile.id;

  usernameEl.textContent =
    profile.name || "";

  handleEl.textContent =
    "@" + profile.handle;

  bioEl.textContent =
    profile.bio || "";

  avatarEl.src =
    profile.avatar ||
    "../assets/default-avatar.png";

  // ukryj follow jeśli to własny profil
  if (CURRENT_USER_ID === PROFILE_USER_ID) {

    followBtn.style.display = "none";

  } else {

    followBtn.style.display = "inline-block";

    await updateFollowButton();

  }

  // załaduj projekty
  const { data: boards } =
    await supabaseClient
      .from("boards")
      .select("id, name, preview")
      .eq("owner_id", PROFILE_USER_ID)
      .eq("public", true)
      .order("updated_at", { ascending: false });

  renderBoards(boards || []);

}

function renderBoards(boards) {

  projectsList.innerHTML = "";

  if (!boards.length) {

    projectsList.innerHTML =
      "<p>Brak publicznych projektów.</p>";

    return;

  }

  boards.forEach(b => {

    const li = document.createElement("li");

    li.className = "project-card";

    li.innerHTML = `
      <div class="project-preview">
        ${b.preview ? `<img src="${b.preview}">` : ""}
      </div>
      <div class="project-title">${b.name}</div>
    `;

    li.onclick = () => {

      window.location.href =
        `../whiteboard/public.html?id=${b.id}`;

    };

    projectsList.appendChild(li);

  });

}

async function updateFollowButton() {

  if (!CURRENT_USER_ID || !PROFILE_USER_ID)
    return;

  const { data } =
    await supabaseClient
      .from("followers")
      .select("id")
      .eq("follower_id", CURRENT_USER_ID)
      .eq("following_id", PROFILE_USER_ID)
      .single();

  if (data) {

    followBtn.textContent = "Obserwujesz";
    followBtn.dataset.following = "true";

  } else {

    followBtn.textContent = "Obserwuj";
    followBtn.dataset.following = "false";

  }

}

followBtn.onclick = async () => {

  if (!CURRENT_USER_ID)
    return;

  const isFollowing =
    followBtn.dataset.following === "true";

  if (isFollowing) {

    await supabaseClient
      .from("followers")
      .delete()
      .eq("follower_id", CURRENT_USER_ID)
      .eq("following_id", PROFILE_USER_ID);

  } else {

    await supabaseClient
      .from("followers")
      .insert({
        follower_id: CURRENT_USER_ID,
        following_id: PROFILE_USER_ID
      });

  }

  updateFollowButton();

};