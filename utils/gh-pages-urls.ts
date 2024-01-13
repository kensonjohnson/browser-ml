export function fixGHPagesUrls(): void {
  const links = document.querySelectorAll("a");

  // add the vite base to all links
  links.forEach((link) => {
    let url = link.getAttribute("href");
    if (url?.startsWith("/")) {
      url = import.meta.env.BASE_URL + url;
      link.setAttribute("href", url);
    }
  });
}
