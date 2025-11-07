// Simple in-memory auth store (replace with database in production)
const users: Record<string, { password: string; role: "player" | "admin" }> = {
  "player@test.com": { password: "player123", role: "player" },
  "admin@test.com": { password: "admin123", role: "admin" },
}

export function validateCredentials(email: string, password: string) {
  const user = users[email]
  if (!user) return null
  if (user.password !== password) return null
  return { email, role: user.role }
}

export function setAuthCookie(email: string) {
  if (typeof document !== "undefined") {
    document.cookie = `auth_user=${email}; path=/`
  }
}

export function getAuthCookie() {
  if (typeof document === "undefined") return null
  const name = "auth_user="
  const decodedCookie = decodeURIComponent(document.cookie)
  const cookieArray = decodedCookie.split(";")
  for (let cookie of cookieArray) {
    cookie = cookie.trim()
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length)
    }
  }
  return null
}

export function clearAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  }
}
