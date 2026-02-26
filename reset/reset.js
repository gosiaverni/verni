console.log("RESET JS loaded");

const form = document.getElementById("resetForm");
const emailInput = document.getElementById("resetEmail");
const msg = document.getElementById("resetMessage");

if (!form) {
  console.error("Brak formularza resetForm w HTML");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "Wysyłanie linku...";

  const email = emailInput.value.trim();

  const { error } =
    await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: "http://127.0.0.1:5500/new-password/new-password.html"
    });

  if (error) {
    console.error(error);
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Sprawdź skrzynkę mailową.";
});
