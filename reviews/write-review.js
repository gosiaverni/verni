// =======================
// CONFIG
// =======================

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y"; // Twój klucz

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// =======================
// PARAMS
// =======================

const params = new URLSearchParams(window.location.search);
const boardId = params.get("boardId");

console.log("BOARD ID:", boardId); // 🔍 debug

// =======================
// LOAD PROJECT
// =======================

async function loadProject() {

  const { data, error } = await supabaseClient
    .from("boards")
    .select("id, name, preview")
    .eq("id", boardId)
    .single();

  console.log("PROJECT:", data, error); // 🔍 debug

  const container = document.getElementById("projectPreview");

  if (error || !data) {
    container.innerHTML = "Nie znaleziono projektu 😢";
    return;
  }

  container.innerHTML = `
    <div style="background:white;border-radius:12px;overflow:hidden;">
      <img src="${data.preview}" style="width:100%" />
      <div style="padding:10px;font-weight:600;">
        ${data.name}
      </div>
    </div>
  `;

  container.onclick = () => {
    window.open(
      `../whiteboard/public.html?id=${boardId}`,
      "_blank"
    );
  };
}

// =======================
// STARS
// =======================

let rating = 0;

function renderStars() {

  const container = document.getElementById("stars");

  for (let i = 1; i <= 5; i++) {

    const star = document.createElement("span");
    star.textContent = "★";
    star.className = "star";

    star.onmouseover = () => highlight(i);
    star.onclick = () => rating = i;

    container.appendChild(star);
  }
}

function highlight(count) {

  const stars = document.querySelectorAll(".star");

  stars.forEach((s, i) => {
    s.classList.toggle("active", i < count);
  });
}

// =======================
// SUBMIT
// =======================

async function submitReview() {
  const title =
  document.getElementById("title").value.trim();
if (!title) return alert("Dodaj tytuł recenzji");
  const content =
    document.getElementById("content").value.trim();

  if (!content) return alert("Napisz recenzję");
  if (!rating) return alert("Dodaj ocenę");

  const { data: userData } =
    await supabaseClient.auth.getUser();

  const userId = userData?.user?.id;

  if (!userId) return alert("Zaloguj się");

  const { error } = await supabaseClient
    .from("reviews")
    .upsert({
      board_id: boardId,
      user_id: userId,
      title: title,
      content,
      rating
    }, {
      onConflict: "user_id,board_id"
    });

  if (error) {
    console.error(error);
    return alert("Błąd zapisu");
  }

  window.location.href =
    `../whiteboard/public.html?id=${boardId}`;

}

// =======================
// INIT
// =======================

document.addEventListener("DOMContentLoaded", () => {

  if (!boardId) {
    alert("Brak boardId w URL");
    return;
  }

  renderStars();
  loadProject();

  document
    .getElementById("submitBtn")
    .onclick = submitReview;
});