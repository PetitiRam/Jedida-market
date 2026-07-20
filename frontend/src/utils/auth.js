export function getUser(){
  const user = localStorage.getItem("jedida_user");

  if(!user) return null;

  return JSON.parse(user);
}


export function isAuthenticated(){
  return !!localStorage.getItem(
    "jedida_access_token"
  );
}


export function logout(){
  localStorage.removeItem(
    "jedida_access_token"
  );

  localStorage.removeItem(
    "jedida_refresh_token"
  );

  localStorage.removeItem(
    "jedida_user"
  );

  window.location.href="/";
}
