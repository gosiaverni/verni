let selectedRating = 0;

function renderStars(container) {

  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {

    const star = document.createElement("span");

    star.textContent = "★";
    star.className = "star";

    star.onmouseover = () => highlightStars(i);
    star.onclick = () => selectedRating = i;

    container.appendChild(star);
  }
}

function highlightStars(count) {

  const stars = document.querySelectorAll(".star");

  stars.forEach((s, i) => {
    s.classList.toggle("active", i < count);
  });
}
async function loadProjectPreview(boardId){

  const { data } = await supabaseClient
    .from("boards")
    .select(`
      name,
      preview,
      profiles:owner_id (
        handle,
        avatar
      )
    `)
    .eq("id", boardId)
    .single();

  if (!data) return;

  const container = document.getElementById("projectInfo");

  container.innerHTML = `
    <div class="project-card">
      <img src="${data.preview}" class="project-image" />

      <div class="project-info">
        <div class="project-name">${data.name}</div>

        <div class="project-author">
          ${data.profiles?.avatar
            ? `<img src="${data.profiles.avatar}" class="author-avatar" />`
            : ""
          }
          <span>@${data.profiles?.handle || "unknown"}</span>
        </div>
      </div>
    </div>
  `;

  // ✅ TERAZ działa
  container.onclick = () => {
    window.open(
      `../whiteboard/public.html?id=${boardId}`,
      "_blank"
    );
  };
}

async function submitReview() {

  const content =
    document.getElementById("reviewContent").value.trim();

  if (!content) {
    alert("Napisz coś 🙃");
    return;
  }

  if (selectedRating === 0) {
    alert("Dodaj ocenę ⭐");
    return;
  }

  const { data: userData } =
    await supabaseClient.auth.getUser();

  const userId = userData?.user?.id;

  if (!userId) {
    alert("Zaloguj się");
    return;
  }

  const { error } = await supabaseClient
    .from("reviews")
    .upsert({
      board_id: boardId,
      user_id: userId,
      content: content,
      rating: selectedRating
    });

  if (error) {
    console.error(error);
    alert("Błąd zapisu");
    return;
  }

  // 🔥 redirect do projektu (lepszy UX niż home)
  window.location.href =
    `../whiteboard/public.html?id=${boardId}`;
}

const params = new URLSearchParams(window.location.search);
const boardId = params.get("boardId");

document.addEventListener("DOMContentLoaded", () => {

  renderStars(document.getElementById("starRating"));
  loadProjectPreview(boardId);

  document
    .getElementById("submitReviewBtn")
    .onclick = submitReview;
});

