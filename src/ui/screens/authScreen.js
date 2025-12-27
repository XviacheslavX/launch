export function initAuthScreen(onLoginSuccess) {
  const loginBtn = document.getElementById("login-btn");

  loginBtn.addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      return alert("Введіть логін і пароль");
    }

    loginBtn.disabled = true;

    try {
      const user = await window.api.login(username, password);
      await onLoginSuccess(user);
    } catch (e) {
      alert(e.message);
    }

    loginBtn.disabled = false;
  });
}
