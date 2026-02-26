const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const form = document.getElementById("newPasswordForm");
const input = document.getElementById("newPassword");
const msg = document.getElementById("newPasswordMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { error } = await supabase.auth.updateUser({
    password: input.value
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Hasło zmienione. Możesz się zalogować.";

  setTimeout(() => {
    window.location.href = "login/login.html";
  }, 1200);
});
