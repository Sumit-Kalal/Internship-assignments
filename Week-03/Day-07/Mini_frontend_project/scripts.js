
const links = document.querySelectorAll("nav a");
const currentPage = window.location.pathname.split("/").pop();

links.forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.style.background = "#2eea5d";
    link.style.color = "white";
  }
});


function validateRegister() {
  let name = document.getElementById("regName").value.trim();
  let email = document.getElementById("regEmail").value.trim();
  let pass = document.getElementById("regPass").value.trim();

  if (name === "" || email === "" || pass === "") {
    alert("All fields are required.");
    return false;
  }

  if (pass.length < 8) {
    alert("Password must be at least 8 characters.");
    return false;
  }

  alert("Registration successful!");
  return true;
}


function validateLogin() {
  let email = document.getElementById("loginEmail").value.trim();
  let pass = document.getElementById("loginPass").value.trim();

  if (email === "" || pass === "") {
    alert("Enter email and password.");
    return false;
  }

  alert("Login successful");
  return true;
}

function sendMessage() {
  let msg = document.getElementById("message").value.trim();
  if (msg === "") {
    alert("Message cannot be empty.");
    return false;
  }

  alert("Message sent!");
  return true;
}
