const axios = require("axios");

// ------------------------------------------------------------
// НАЛАШТУВАННЯ AZURIOM
// ------------------------------------------------------------
const API_BASE = "http://mysize.local.test/api/auth";

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
async function login(identifier, password) {
    try {
        const res = await axios.post(`${API_BASE}/authenticate`, {
            email: identifier,
            password
        });

        return {
            token: res.data.access_token,
            id: res.data.id,
            uuid: res.data.uuid,
            username: res.data.username
        };

    } catch (err) {
        console.error("[AZURIOM] Login error:", err.response?.data || err);
        throw new Error(
            err.response?.data?.message || "Невірний логін або пароль"
        );
    }
}

// ------------------------------------------------------------
// VERIFY TOKEN
// ------------------------------------------------------------
async function verify(token) {
    try {
        const res = await axios.post(`${API_BASE}/verify`, {
            access_token: token
        });
        return res.data;
    } catch {
        return null;
    }
}

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
async function logout(token) {
    if (!token) return;

    try {
        await axios.post(`${API_BASE}/logout`, {
            access_token: token
        });
    } catch (e) {
        console.warn("[AZURIOM] Logout failed (ignored)");
    }
}

// ------------------------------------------------------------
// LAUNCHER TOKEN
// ------------------------------------------------------------
async function getLauncherToken(accessToken) {
    try {
        const res = await axios.post(
            "http://mysize.local.test/api/launcher/token",
            {},
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        return res.data.token;

    } catch (err) {
        console.error("[AZURIOM] Launcher token error:", err.response?.data || err);
        throw new Error("Failed to get launcher token");
    }
}


module.exports = {
    login,
    verify,
    logout,
    getLauncherToken
};
