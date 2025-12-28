export async function loadHTML(target, relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const res = await fetch(url);
  const html = await res.text();
  target.insertAdjacentHTML("beforeend", html);
}
