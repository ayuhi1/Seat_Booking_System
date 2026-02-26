function getUser() {
  const raw = localStorage.getItem("sb_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setUser(u) {
  localStorage.setItem("sb_user", JSON.stringify(u));
}

function clearUser() {
  localStorage.removeItem("sb_user");
}

export { getUser, setUser, clearUser };
