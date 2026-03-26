export const skipToMain = () => {
  const main = document.querySelector('main');
  if (main) main.focus();
};