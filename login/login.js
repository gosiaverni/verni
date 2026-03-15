// ====== KONFIGURACJA SUPABASE ======

const SUPABASE_URL = "https://jnqaorggoplsxsnzkunx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucWFvcmdnb3Bsc3hzbnprdW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5Nzg0NjQsImV4cCI6MjA4NTU1NDQ2NH0.BknI5qGa34j4e9ktEizlOdYKiCWwrMLps3trfYN-H4Y";


const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ====== AUTO-REDIRECT JEŚLI JUŻ ZALOGOWANY ======

const { data: sessionData } = await supabaseClient.auth.getSession();

if (sessionData.session) {
  window.location.href = "/home/home.html";
}

// ====== ELEMENTY DOM ======

const form = document.getElementById("authForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const msg = document.getElementById("authMessage");

// ====== OBSŁUGA FORMULARZA ======

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "Logowanie...";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    msg.textContent = "Nieprawidłowy email lub hasło.";
    return;
  }

  window.location.href = "/home/home.html";
});

const signupBtn = document.getElementById("signupBtn");

signupBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  msg.textContent = "Tworzenie konta...";

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Konto utworzone! Sprawdź email.";

});