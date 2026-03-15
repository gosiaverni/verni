// konfiguracja Supabase

const supabaseUrl = "https://jnqaorggoplsxsnzkunx.supabase.co"
const supabaseKey = "TWÓJ_ANON_KEY"

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey)

let userId = null



// pobranie aktualnego użytkownika
async function initUser(){

  const { data: { user }, error } = await supabaseClient.auth.getUser()

  if(error){
    console.error(error)
    return
  }

  if(user){
    userId = user.id
  }

}

initUser()

const form = document.getElementById("jobForm")

form.addEventListener("submit", async (event) => {

  event.preventDefault()

  if(!userId){
    alert("Musisz być zalogowany aby dodać ogłoszenie")
    return
  }

  const formData = new FormData(form)

  const job = {
    title: formData.get("title"),
    company: formData.get("company"),
    description: formData.get("description"),
    location: formData.get("location"),
    type: formData.get("type"),
    salary: formData.get("salary"),
    contact_email: formData.get("contact_email"),
    user_id: userId
  }

  const { error } = await supabaseClient
    .from("jobs")
    .insert([job])

  if (error) {
    console.error(error)
    alert("Błąd dodawania ogłoszenia")
    return
  }

  form.reset()

  loadJobs()

})



async function loadJobs(){

  const container = document.getElementById("jobsContainer")

  container.innerHTML = "Ładowanie..."

  const { data, error } = await supabaseClient
  .from("jobs")
  .select(`
    *,
    profiles (
handle,
avatar_url
)
  `)
  .order("created_at", { ascending:false })

  if(error){
    console.error(error)
    container.innerHTML = "Błąd ładowania ogłoszeń"
    return
  }

  container.innerHTML = ""

  data.forEach(job => {

    const jobElement = document.createElement("div")

    jobElement.classList.add("job-card")

    jobElement.innerHTML = `

<div class="job-author-row">

<img 
class="job-author-avatar"
src="${job.profiles?.avatar_url || '../assets/default-avatar.png'}"
>

<a href="../profil/profile.html?handle=${job.profiles?.handle}" class="job-author">
@${job.profiles?.handle || "unknown"}
</a>

</div>

<div class="job-title">${job.title}</div>

<div class="job-company">${job.company || "Nie podano firmy"}</div>

<div class="job-description">
${job.description || ""}
</div>

<div class="job-meta">

<span>Lokalizacja: ${job.location || "-"}</span>
<span>Typ pracy: ${job.type || "-"}</span>
<span>Wynagrodzenie: ${job.salary || "-"}</span>

</div>

`

    container.appendChild(jobElement)

  })

}

loadJobs()