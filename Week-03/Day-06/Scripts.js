function showAlert() {
  alert("Yes the script is working");
}

function validateForm() {
  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  if (name === "" || email === "" || password === "") {
    alert("All fields are required!");
    return false;
  }

  alert("Form submitted successfully!");
  return true;
}

function calculate() {
  let n1 = parseFloat(document.getElementById("num1").value);
  let n2 = parseFloat(document.getElementById("num2").value);
  let op = document.getElementById("operator").value;
  let result;


  if (op === "+") result = n1 + n2;
  if (op === "-") result = n1 - n2;
  if (op === "*") result = n1 * n2;
  if (op === "/") result = n1 / n2;

  document.getElementById("result").innerText = "Result: " + result;
}

function changeText() {
  document.getElementById("text").innerText = "Dont go pressing around random buttons, world isnt the same as it was before.";
}