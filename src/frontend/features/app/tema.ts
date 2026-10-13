// Tema claro/escuro: a escolha fica no localStorage e vira data-theme no <html>.
// "sistema" tira o atributo e o tokens.css segue o prefers-color-scheme.

export type Tema = "claro" | "escuro" | "sistema";

const CHAVE = "tema";
const EVENTO = "tema-mudou";

/** Roda no <head> antes da primeira pintura, para a página não piscar no tema errado. */
export const SCRIPT_TEMA = `try{var t=localStorage.getItem("${CHAVE}");if(t==="claro"||t==="escuro")document.documentElement.setAttribute("data-theme",t==="escuro"?"dark":"light")}catch(e){}`;

export function lerTema(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === "claro" || salvo === "escuro" ? salvo : "sistema";
  } catch {
    return "sistema";
  }
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
  try {
    localStorage.setItem(CHAVE, tema);
  } catch {
    // Sem localStorage (aba anônima bloqueada): o tema vale só até recarregar.
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function observarTema(aoMudar: () => void) {
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}
