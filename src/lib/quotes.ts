export const QUOTES: { text: string; author: string }[] = [
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Vender é transferir confiança.", author: "Zig Ziglar" },
  { text: "Sua marca é o que as pessoas dizem de você quando você não está na sala.", author: "Jeff Bezos" },
  { text: "Quem não mede, não gerencia. Quem não gerencia, não melhora.", author: "Peter Drucker" },
  { text: "A melhor maneira de prever o futuro é criá-lo.", author: "Peter Drucker" },
  { text: "Marketing não é uma batalha de produtos, é uma batalha de percepções.", author: "Al Ries" },
  { text: "Comece onde você está. Use o que você tem. Faça o que você pode.", author: "Arthur Ashe" },
  { text: "Disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "Persistência é o caminho do êxito.", author: "Charles Chaplin" },
  { text: "Não conte os dias, faça com que os dias contem.", author: "Muhammad Ali" },
  { text: "Foque no progresso, não na perfeição.", author: "Anônimo" },
  { text: "Pessoas não compram produtos, compram resultados.", author: "Anônimo" },
  { text: "Quanto mais você sua no treino, menos sangra na batalha.", author: "Sun Tzu" },
  { text: "Tudo que você quer está do outro lado do medo.", author: "Jack Canfield" },
  { text: "Não espere por oportunidade. Crie-a.", author: "George Bernard Shaw" },
  { text: "O que não é medido, não é melhorado.", author: "Lord Kelvin" },
  { text: "Quem para de fazer publicidade para economizar dinheiro, é como quem para o relógio para economizar tempo.", author: "Henry Ford" },
  { text: "A melhor propaganda é feita por clientes satisfeitos.", author: "Philip Kotler" },
  { text: "Trabalhe duro em silêncio. Deixe o sucesso fazer o barulho.", author: "Frank Ocean" },
  { text: "Grandes resultados exigem grandes ambições.", author: "Heráclito" },
  { text: "Você é a média das 5 pessoas com quem mais convive.", author: "Jim Rohn" },
  { text: "Faça hoje o que os outros não querem, para viver amanhã como os outros não podem.", author: "Jerry Rice" },
  { text: "Empreender é resolver problemas que importam.", author: "Anônimo" },
  { text: "Conteúdo é rei, mas distribuição é rainha.", author: "Anônimo" },
  { text: "Quem tem clareza, vence.", author: "Anônimo" },
  { text: "Foco é dizer não para 100 boas ideias.", author: "Steve Jobs" },
  { text: "Não venda o produto. Venda a transformação.", author: "Anônimo" },
  { text: "Coragem não é a ausência de medo, é a ação apesar dele.", author: "Mark Twain" },
  { text: "O segredo do sucesso é a constância no propósito.", author: "Benjamin Disraeli" },
  { text: "Resultados extraordinários exigem ações extraordinárias.", author: "Anônimo" },
];

export function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0).getTime();
  const day = Math.floor((now.getTime() - start) / 86400000);
  return QUOTES[day % QUOTES.length];
}
