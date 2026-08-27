export const syncAuthCookies = async (token, role, adminToken) => {
  try {
    const res = await fetch("/api/auth/cookie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, role, adminToken }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to sync auth cookies:", err);
    return false;
  }
};

export const clearAuthCookies = async () => {
  try {
    await fetch("/api/auth/cookie", {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Failed to clear auth cookies:", err);
  }
};
