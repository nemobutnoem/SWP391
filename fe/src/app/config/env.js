export const env = {
  useMock: String(import.meta.env.VITE_USE_MOCK).toLowerCase() === "true",
  apiUrl: import.meta.env.VITE_API_URL || "",
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
};