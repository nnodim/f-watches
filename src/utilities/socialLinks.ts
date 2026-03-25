export const buildInstagramProfileDeepLink = (username: string) => {
  const normalizedUsername = username.replace(/^@/, '').trim()
  return `instagram://user?username=${encodeURIComponent(normalizedUsername)}`
}
