function openNav() {
    document.getElementById("mySidenav").style.width = "15vw";
  }
  
/* Set the width of the side navigation to 0 */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0vw";
}


function googleauth() {
  const clientId = '424864705320-thcgnlh7cfchmvumtoi833qiqha61r19.apps.googleusercontent.com';
  const redirectUri = 'http://127.0.0.1:5500/logged.html';
  const authUrl = 'https://accounts.google.com/o/oauth2/auth';
  const scope = 'email'; // Adjust scope as needed

  // Build authorization URL
  const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope
  });


  const url = `${authUrl}?${authParams.toString()}`;

  // Redirect the user to the OAuth provider's authorization endpoint
  window.location.href = url;
}

console.log('hello');

// Call handleAuthorizationResponse when the page loads to handle the redirect from the OAuth provider

document.getElementById("profile").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("dashboard").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("team").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("projects").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("signup").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("signUp").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

document.getElementById("logIn").addEventListener('click',()=>{
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("login").classList.add("flex");
});

