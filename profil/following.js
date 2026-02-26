let CURRENT_USER_ID = null;

init();

async function init() {

  const { data } =
    await supabaseClient.auth.getUser();

  CURRENT_USER_ID =
    data?.user?.id;

  loadFollowing();

}

async function loadFollowing() {

  const list =
    document.getElementById("followingList");

  list.innerHTML = "";

  const { data, error } =
    await supabaseClient
      .from("followers")
      .select(`
        profiles:following_id (
          handle,
          name,
          avatar
        )
      `)
      .eq("follower_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false });

  if (error) {

    console.error(error);
    return;

  }

  if (!data.length) {

    list.innerHTML =
      "<p>Nie obserwujesz jeszcze nikogo.</p>";

    return;

  }

  data.forEach(row => {

    const p = row.profiles;

    const li =
      document.createElement("li");

    li.className =
      "following-item";

    li.innerHTML = `

      <img
        class="following-avatar"
        src="${p.avatar || "../assets/profile-logo.png"}"
      >

      <div class="following-info">

        <div class="following-name">
          ${p.name || ""}
        </div>

        <div class="following-handle">
          @${p.handle}
        </div>

      </div>

    `;

    li.onclick = () => {

      window.location.href =
        `../public/public-profile.html?handle=${p.handle}`;

    };

    list.appendChild(li);

  });

}