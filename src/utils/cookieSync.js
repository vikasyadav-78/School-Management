export const syncAuthCookies = async (token, role, adminToken) => {
  try {
    await fetch("/api/auth/cookie", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, role, adminToken }),
    });
  } catch (err) {
    console.error("Failed to sync auth cookies:", err);
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
