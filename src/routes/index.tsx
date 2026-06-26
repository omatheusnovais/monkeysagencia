import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Check, Sparkles, Target, Users, TrendingUp, Bot, BarChart3,
  Zap, MessageSquare, Search, LayoutTemplate, Brain, Database,
  Star, Instagram, Phone, Shield, Rocket, Gauge,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import monkeysLogo from "@/assets/monkeys-logo.png.asset.json";

const WHATSAPP_URL = `https://wa.me/5562993519901?text=${encodeURIComponent("Olá vim pela Landing Page e gostaria de agendar uma reunião!")}`;
const INSTAGRAM_AGENCY = "https://www.instagram.com/monkeys.agencia";
const INSTAGRAM_PERSONAL = "https://www.instagram.com/omatheusnovais";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monkeys Agência - Tráfego Pago | Geração de Leads Qualificados" },
      { name: "description", content: "A Monkeys Agência cria sistemas previsíveis de aquisição de clientes com Meta Ads, Google Ads, Landing Pages otimizadas e automação. Diagnóstico gratuito." },
      { property: "og:title", content: "Monkeys Agência - Tráfego Pago de Performance" },
      { property: "og:description", content: "Sistemas previsíveis de aquisição com Meta Ads, Google Ads e CRM." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

function GlowBg() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#4F7CFF] opacity-20 blur-[140px]" />
      <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-[#8B5CF6] opacity-15 blur-[140px]" />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Serviços", href: "#servicos" },
    { label: "Cases", href: "#cases" },
    { label: "Método", href: "#metodo" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2" aria-label="Monkeys Agência">
          <img src={monkeysLogo.url} alt="Monkeys Agência" className="h-7 w-auto invert" />
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#diagnostico" className="hidden md:inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90">
          Agendar Diagnóstico <ArrowRight className="h-4 w-4" />
        </a>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          <div className="space-y-1.5">
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-6 bg-white" />
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-black/90 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map(l => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-sm text-white/80">{l.label}</a>
            ))}
            <a href="#diagnostico" onClick={() => setOpen(false)} className="rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-black">
              Agendar Diagnóstico
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#4F7CFF]/30 to-[#8B5CF6]/30 blur-3xl" />
      <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 backdrop-blur-xl shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-2 text-xs text-white/40">Dashboard de Performance</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "Leads Hoje", value: "+48", change: "+24%", up: true },
            { title: "CPA Médio", value: "R$ 12,37", change: "-31%", up: true },
            { title: "Conversões", value: "+312%", change: "este mês", up: true },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-xl border border-white/10 bg-black/40 p-3"
            >
              <div className="text-[10px] uppercase tracking-wider text-white/40">{c.title}</div>
              <div className="mt-1 text-lg font-bold text-white">{c.value}</div>
              <div className="mt-1 text-[10px] text-emerald-400">{c.change}</div>
            </motion.div>
          ))}
        </div>
        {/* Chart */}
        <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-white/60">Performance · últimos 30 dias</div>
            <div className="text-xs text-emerald-400">▲ 24.8%</div>
          </div>
          <svg viewBox="0 0 300 100" className="h-24 w-full">
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4F7CFF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4F7CFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,80 L30,70 L60,75 L90,55 L120,60 L150,40 L180,45 L210,30 L240,25 L270,15 L300,10 L300,100 L0,100 Z" fill="url(#g1)" />
            <path d="M0,80 L30,70 L60,75 L90,55 L120,60 L150,40 L180,45 L210,30 L240,25 L270,15 L300,10" stroke="#4F7CFF" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {[40, 55, 35, 70, 50, 80, 65].map((h, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              style={{ height: `${h}%` }}
              className="origin-bottom rounded-sm bg-gradient-to-t from-[#4F7CFF] to-[#8B5CF6]"
            />
          ))}
        </div>
      </div>
      {/* Floating notification */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute -right-4 -top-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-3 py-2 backdrop-blur-xl shadow-xl md:-right-8"
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-xs font-semibold">Novo Lead</div>
          <div className="text-[10px] text-white/50">há 2 segundos</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Hero() {
  const benefits = [
    "De 5 a 30 leads qualificados por dia",
    "CPA até 60% menor em 60 dias",
    "Follow-up automático que recupera quem ia escapar",
    "Previsibilidade real, sem depender de indicação",
  ];
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32 motion-reduce:[&_*]:!animate-none">
      <GlowBg />
      {/* subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Eyebrow */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-xl"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Performance de alto nível · 2026
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-[2rem] font-black leading-[1.05] tracking-[-0.03em] sm:text-[2.75rem] md:text-[3.5rem]"
            >
              Mais previsibilidade na sua

              <br />
              <span className="relative inline-block bg-gradient-to-r from-white via-[#c9d4ff] to-[#a48bff] bg-clip-text text-transparent">
                geração de clientes

                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  className="absolute -bottom-2 left-0 h-2 w-full text-[#4F7CFF]"
                  preserveAspectRatio="none"
                >
                  <path d="M2 8 Q 75 2, 150 6 T 298 5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-7 max-w-xl text-base leading-relaxed text-white/65 md:text-lg"
            >
              Cansado de gastar com anúncio e não ver retorno? A gente monta o seu sistema de aquisição com <span className="text-white">Meta Ads</span>, <span className="text-white">Google Ads</span>, landing page de alta conversão e automação de CRM, para você vender todo dia, sem depender de sorte.
            </motion.p>

            <motion.ul variants={fadeUp} className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#4F7CFF]/15 ring-1 ring-[#4F7CFF]/30">
                    <Check className="h-3 w-3 text-[#4F7CFF]" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#diagnostico"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] px-7 py-4 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(79,124,255,0.6)] transition-all hover:scale-[1.02] hover:shadow-[0_15px_50px_-10px_rgba(139,92,246,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Quero minha análise gratuita de tráfego"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                Quero meu diagnóstico gratuito
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                Falar com especialista no WhatsApp
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center -space-x-2">
                {[12, 32, 47, 65].map((id) => (
                  <img
                    key={id}
                    src={`https://i.pravatar.cc/80?img=${id}`}
                    alt="Cliente Monkeys Agência"
                    loading="lazy"
                    className="h-9 w-9 rounded-full border-2 border-black object-cover"
                  />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1 font-semibold text-white">4.9/5</span>
                </div>
                <div className="text-xs text-white/55">
                  +150 empresas atendidas · R$ 2,1 mi investidos com lucro
                </div>
              </div>
            </motion.div>
          </motion.div>

          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}

function LogosSection() {
  const stats = [
    "+R$ 2,1 mi investidos com lucro",
    "+150 empresas atendidas",
    "+430% de aumento médio em leads",
    "-37% de redução média no CPA",
    "ROAS médio de 6,8x",
    "+8 anos de operação",
  ];
  const loop = [...stats, ...stats];
  return (
    <section className="border-y border-white/5 bg-black/40 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-white/40">
          Resultados reais que entregamos
        </p>
        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max gap-12 animate-marquee">
            {loop.map((s, i) => (
              <div key={`${s}-${i}`} className="shrink-0 text-sm font-semibold tracking-wide text-white/50 transition-colors hover:text-white/80">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultsSection() {
  const items = [
    { number: "+430%", label: "Aumento de Leads" },
    { number: "-37%", label: "Redução de CPA" },
    { number: "+R$ 2.1M", label: "Investidos em tráfego" },
    { number: "+150", label: "Projetos entregues" },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-center text-3xl font-bold tracking-tight md:text-5xl"
        >
          Resultados <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">Reais</span>
        </motion.h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-8 backdrop-blur hover-lift hover-glow"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#4F7CFF]/20 blur-3xl transition-all group-hover:bg-[#4F7CFF]/40" />
              <div className="relative bg-gradient-to-br from-white to-white/60 bg-clip-text text-4xl font-black text-transparent md:text-5xl">
                {it.number}
              </div>
              <div className="relative mt-2 text-sm text-white/60">{it.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const cards = [
    { Icon: Target, title: "Anúncio que não vende", description: "Você paga pelo clique, mas o lead some no meio do caminho, e o boleto do tráfego chega igual." },
    { Icon: Users, title: "Leads que enrolam", description: "Curioso que pede preço, some no WhatsApp e nunca fecha. Seu time perde tempo, você perde dinheiro." },
    { Icon: TrendingUp, title: "Mês bom, mês ruim", description: "Sem previsibilidade, planejar contratação, estoque ou caixa vira aposta. Crescer assim cansa." },
  ];
  return (
    <section className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-center text-3xl font-bold leading-tight tracking-tight md:text-5xl"
        >
          Seu tráfego não é o problema.
          <br />
          <span className="text-white/50">Sua estrutura de conversão é.</span>
        </motion.h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-7 backdrop-blur transition-all hover:border-[#4F7CFF]/30"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-[#4F7CFF]/20 to-[#8B5CF6]/20 border border-white/10">
                <c.Icon className="h-5 w-5 text-[#4F7CFF]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-white/60">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const steps = [
    { step: 1, title: "Diagnóstico em 24h", desc: "Auditamos suas campanhas, LP e funil, e mostramos onde está vazando dinheiro.", Icon: Search },
    { step: 2, title: "Estratégia sob medida", desc: "Criamos oferta, criativos e landing page validados para o seu nicho.", Icon: Brain },
    { step: 3, title: "Lançamento em até 7 dias", desc: "Subimos campanhas, integramos o CRM e começamos a captar leads.", Icon: Rocket },
    { step: 4, title: "Otimização e escala", desc: "Acompanhamento diário, relatórios semanais e crescimento composto.", Icon: TrendingUp },
  ];
  return (
    <section id="metodo" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Sparkles className="h-3 w-3 text-[#4F7CFF]" /> Método
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            Nosso Método de Crescimento <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">Previsível</span>
          </h2>
        </motion.div>
        <div className="relative mt-16 grid gap-5 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent md:block" />
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur"
            >
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] text-sm font-bold shadow-lg shadow-[#4F7CFF]/30">
                {s.step}
              </div>
              <h3 className="mt-5 flex items-center gap-2 text-lg font-semibold">
                <s.Icon className="h-4 w-4 text-[#4F7CFF]" />
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-white/60">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const cards = [
    { Icon: Target, service: "Meta Ads", desc: "Campanhas que enchem seu WhatsApp de leads quentes." },
    { Icon: Search, service: "Google Ads", desc: "Apareça na hora em que o cliente já quer comprar." },
    { Icon: LayoutTemplate, service: "Landing Pages", desc: "Páginas que convertem 2 a 5x mais que o seu site atual." },
    { Icon: Bot, service: "Atendimento qualificado", desc: "Roteiros e fluxo no WhatsApp para qualificar e agendar reuniões." },
    { Icon: Database, service: "CRM + Automação", desc: "Follow-up automático que recupera quem ia escapar." },
    { Icon: BarChart3, service: "Relatórios claros", desc: "Você vê o ROI da sua verba toda semana, sem achismo." },
  ];
  return (
    <section id="servicos" className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          className="text-center text-3xl font-bold tracking-tight md:text-5xl"
        >
          O que <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">entregamos</span>
        </motion.h2>
        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.service}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 backdrop-blur transition-all hover:border-[#4F7CFF]/40 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#4F7CFF]/0 to-[#8B5CF6]/0 transition-all group-hover:from-[#4F7CFF]/5 group-hover:to-[#8B5CF6]/5" />
              <div className="relative">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <c.Icon className="h-5 w-5 text-[#4F7CFF]" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{c.service}</h3>
                <p className="mt-1.5 text-sm text-white/60">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CasesSection() {
  const cases = [
    { company: "Clínica Estética", segment: "Saúde e Beleza", result: "+387%", label: "em Leads" },
    { company: "Escola de Idiomas", segment: "Educação", result: "+254%", label: "em Matrículas" },
    { company: "Consultoria Financeira", segment: "Serviços B2B", result: "-41%", label: "CPA reduzido" },
  ];
  return (
    <section id="cases" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center text-3xl font-bold tracking-tight md:text-5xl">
          Resultados <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">Reais</span>
        </motion.h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.company}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur"
            >
              <div className="relative h-40 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#4F7CFF]/20 to-[#8B5CF6]/20 p-5">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-white/30" />
                    <div className="h-2 w-2 rounded-full bg-white/30" />
                  </div>
                  <svg viewBox="0 0 200 60" className="w-full">
                    <path d="M0,50 L40,35 L80,40 L120,20 L160,25 L200,5" stroke="white" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              </div>
              <div className="p-6">
                <div className="text-xs uppercase tracking-widest text-white/40">{c.segment}</div>
                <h3 className="mt-2 text-lg font-semibold">{c.company}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-3xl font-black text-transparent">{c.result}</span>
                  <span className="text-sm text-white/60">{c.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const items = [
    { name: "Carlos Mendes", role: "CEO, Clínica Vita", text: "Em 60 dias triplicamos os agendamentos. O método é cirúrgico e os relatórios são claríssimos." },
    { name: "Ana Paula Souza", role: "Diretora, Idiomas Plus", text: "Saímos de 30 para 120 matrículas/mês. O time entende de performance de verdade." },
    { name: "Rafael Lima", role: "Sócio, Lima Consultoria", text: "Cortamos o CPA pela metade. Hoje temos previsibilidade pra planejar trimestres inteiros." },
  ];
  return (
    <section className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center text-3xl font-bold tracking-tight md:text-5xl">
          O que nossos <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">clientes dizem</span>
        </motion.h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 backdrop-blur"
            >
              <div className="flex gap-0.5 text-[#4F7CFF]">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/80">"{t.text}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6] text-sm font-bold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-white/50">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MethodFlowSection() {
  const steps = [
    { Icon: Target, label: "Meta/Google Ads" },
    { Icon: LayoutTemplate, label: "Landing Page" },
    { Icon: Database, label: "CRM" },
    { Icon: Zap, label: "Automação" },
    { Icon: TrendingUp, label: "Vendas" },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center text-3xl font-bold tracking-tight md:text-5xl">
          A <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">Máquina</span> de Crescimento
        </motion.h2>
        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-3 backdrop-blur"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#4F7CFF]/30 to-[#8B5CF6]/30">
                  <s.Icon className="h-4 w-4 text-[#4F7CFF]" />
                </div>
                <span className="text-sm font-medium">{s.label}</span>
              </motion.div>
              {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-white/30" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="bg-[#080808] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#4F7CFF]/30 to-[#8B5CF6]/30 blur-3xl" />
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur">
                <div className="grid h-full w-full place-items-center">
                  <Gauge className="h-32 w-32 text-[#4F7CFF]" strokeWidth={1} />
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Shield className="h-3 w-3 text-[#4F7CFF]" /> Quem está por trás
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Matheus Novais, <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">+12 anos</span> de mercado
            </h2>
            <p className="mt-6 text-white/70">
              Designer, Gestor de Tráfego e Especialista em Marketing Digital pela UNOPAR, com ênfase em Redes Sociais, Gestão de Crises e Lifecoach. Há mais de 12 anos atua como mentor e estrategista digital de empresas e empreendedores, ajudando-os a criar experiências únicas para seus clientes por meio do design e do marketing. Atualmente cursa Teologia pela Unicesumar.
            </p>
            <p className="mt-4 text-white/70">
              No portfólio: <span className="text-white">Pactus Brasil, Tudo Belo Estética, IESE Cursos, Larissa Lobo Academy, Wanna Bear, Goiânia Shopping, Casa do Pica-Pau, Passeio das Águas, Órion Complex, Buena Vista, Grupo Navesa, IGD, Thaê</span> e muitas outras.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Facebook & Instagram Ads",
                "Inbound Marketing",
                "Geração de Leads",
                "Web Design",
                "Social Media 360°",
                "Estratégia de Conteúdo",
                "WhatsApp Business",
                "Branding",
              ].map(q => (
                <span key={q} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">{q}</span>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { v: "+12 anos", l: "Mercado" },
                { v: "+R$ 2M", l: "Investidos" },
                { v: "+150", l: "Operações" },
              ].map(h => (
                <div key={h.l} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
                  <div className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-xl font-black text-transparent">{h.v}</div>
                  <div className="mt-1 text-xs text-white/60">{h.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function OfferSection() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = [
    "Auditoria gratuita das suas campanhas e LP atuais",
    "Onde sua verba está vazando (em R$) e como tampar",
    "Projeção realista de leads e CPA para o seu nicho",
    "Plano de ação de 30 dias, leva mesmo se não fechar",
  ];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const company = String(fd.get("company") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const faturamento = String(fd.get("faturamento") ?? "");
    const investimento = String(fd.get("investimento") ?? "");

    const message = `Empresa: ${company}\nFaturamento mensal: ${faturamento}\nInvestimento diário: ${investimento}`;

    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

    const { error: err } = await supabase.from("leads").insert({
      name,
      phone,
      message,
      status: "novos",
      label_id: null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
    });
    setLoading(false);
    if (err) { setError("Não foi possível enviar agora. Tente novamente."); return; }
    setSent(true);

    // Meta Pixel — Lead + QualifiedLead
    try {
      const { fbTrack, fbTrackCustom } = await import("@/lib/fbpixel");
      fbTrack("Lead", { content_name: "Diagnóstico gratuito", investimento, faturamento });
      const qualified = investimento && investimento !== "Não invisto ainda";
      if (qualified) {
        fbTrackCustom("QualifiedLead", { investimento, faturamento, company });
      }
    } catch {/* ignore */}
  }

  return (
    <section id="diagnostico" className="relative overflow-hidden py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F7CFF] opacity-10 blur-[160px]" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-xl md:p-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4F7CFF]/30 bg-[#4F7CFF]/10 px-3 py-1 text-xs font-medium text-[#4F7CFF]">
              <Sparkles className="h-3 w-3" /> Diagnóstico Gratuito
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Descubra em 24h quanto a sua verba pode <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">render de verdade</span>
            </h2>
            <ul className="mt-6 space-y-3">
              {items.map(i => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/80">
                  <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4F7CFF] to-[#8B5CF6]">
                    <Check className="h-3 w-3" />
                  </div>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur">
            {sent ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20">
                    <Check className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">Recebemos seu contato!</h3>
                  <p className="mt-2 text-sm text-white/60">Entraremos em contato em até 24h.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <Field label="Nome completo" name="name" type="text" required />
                <Field label="Nome da empresa" name="company" type="text" required />
                <Field label="WhatsApp" name="phone" type="tel" required />
                <SelectField label="Faturamento mensal" name="faturamento" options={["Até R$10k", "R$10k–30k", "R$30k–60k", "R$60k–120k", "Acima de R$120k"]} />
                <SelectField label="Investimento diário em tráfego" name="investimento" options={["Não invisto ainda", "Até R$50/dia", "R$51–100/dia", "Acima de R$100/dia"]} />
                {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
                <button type="submit" disabled={loading} className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4F7CFF]/30 transition-all hover:scale-[1.01] disabled:opacity-60">
                  {loading ? "Enviando..." : "Quero meu diagnóstico gratuito"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/70">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all focus:border-[#4F7CFF] focus:bg-white/[0.07] focus:ring-2 focus:ring-[#4F7CFF]/30"
      />
    </label>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/70">{label}</span>
      <select
        name={name}
        required
        defaultValue=""
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all focus:border-[#4F7CFF] focus:ring-2 focus:ring-[#4F7CFF]/30"
      >
        <option value="" disabled className="bg-black">Selecione...</option>

        {options.map(o => <option key={o} value={o} className="bg-black">{o}</option>)}
      </select>
    </label>
  );
}

function FaqSection() {
  const items = [
    { q: "Em quanto tempo vejo resultados?", a: "A maioria dos clientes começa a ver leads qualificados nos primeiros 7 a 15 dias. O ramp-up completo acontece entre 30 e 60 dias." },
    { q: "Vocês trabalham com qual investimento mínimo?", a: "Recomendamos a partir de R$50/dia em mídia paga para gerar dados suficientes pra otimizar. Atendemos de pequenos negócios a operações grandes." },
    { q: "Preciso ter site ou landing page pronta?", a: "Não. Construímos a landing page otimizada como parte do projeto, focada 100% em conversão." },
    { q: "Como funciona o contrato?", a: "O período mínimo de contrato é de 3 meses (90 dias), tempo necessário para estruturar campanhas, coletar dados e otimizar resultados. Após esse período, você decide se quer continuar mês a mês." },
    { q: "Quais plataformas vocês usam?", a: "Meta Ads, Google Ads, Performance Max, YouTube, além de CRM e ferramentas de automação." },
    
  ];
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-center text-3xl font-bold tracking-tight md:text-5xl">
          Perguntas <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">Frequentes</span>
        </motion.h2>
        <div className="mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((it, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 backdrop-blur">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-white/70">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] opacity-20 blur-[140px]" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.h2 initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
          Pronto para ter mais previsibilidade na sua
          <br />
          <span className="bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] bg-clip-text text-transparent">geração de clientes?</span>
        </motion.h2>
        <p className="mt-5 text-lg text-white/70">Diagnóstico 100% gratuito, sem compromisso. Resposta em até 24h, e o plano é seu mesmo se a gente não fechar.</p>
        <a href="#diagnostico" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F7CFF] to-[#8B5CF6] px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-[#4F7CFF]/40 transition-all hover:scale-[1.02]">
          Quero meu diagnóstico agora
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img src={monkeysLogo.url} alt="Monkeys Agência" className="h-6 w-auto invert" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-white/70">Monkeys Agência</span>
            <span className="text-[11px] text-white/40">Agência de Performance · © {new Date().getFullYear()}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-white/60">
          <a href={INSTAGRAM_AGENCY} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
            <Instagram className="h-4 w-4" />@monkeys.agencia
          </a>
          <a href={INSTAGRAM_PERSONAL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
            <Instagram className="h-4 w-4" />@omatheusnovais
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
            <Phone className="h-4 w-4" />(62) 99351-9901
          </a>
          <Dialog>
            <DialogTrigger className="transition-colors hover:text-white">Política de Privacidade</DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto border-white/10 bg-[#0a0a0a] text-white sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Política de Privacidade</DialogTitle>
                <DialogDescription className="text-white/60">
                  Última atualização: {new Date().toLocaleDateString("pt-BR")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm leading-relaxed text-white/70">
                <p>
                  A <strong className="text-white">Monkeys Agência</strong> respeita sua privacidade e está comprometida em proteger os dados pessoais que você compartilha conosco. Esta política descreve, de forma transparente, como coletamos, usamos e armazenamos suas informações.
                </p>
                <div>
                  <h3 className="mb-1 font-semibold text-white">1. Dados coletados</h3>
                  <p>Coletamos informações fornecidas voluntariamente por você ao preencher formulários no site (nome, e-mail, telefone, empresa) e dados de navegação anônimos (cookies, UTMs, páginas visitadas) para fins estatísticos.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-white">2. Uso das informações</h3>
                  <p>Utilizamos seus dados exclusivamente para entrar em contato, enviar propostas comerciais, executar serviços contratados e melhorar a experiência no site. Não vendemos nem compartilhamos suas informações com terceiros sem autorização.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-white">3. Armazenamento e segurança</h3>
                  <p>Seus dados são armazenados em ambiente seguro, com acesso restrito à equipe da Monkeys Agência. Adotamos medidas técnicas e organizacionais razoáveis para proteção contra acessos não autorizados.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-white">4. Cookies</h3>
                  <p>Usamos cookies para análise de tráfego, remarketing e otimização de campanhas (Meta Ads, Google Ads). Você pode desativá-los nas configurações do seu navegador.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-white">5. Seus direitos (LGPD)</h3>
                  <p>Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-white">6. Contato</h3>
                  <p>Para dúvidas ou solicitações relacionadas à privacidade, fale conosco pelo WhatsApp (62) 99351-9901 ou via Instagram @monkeys.agencia.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased font-sans">
      <Header />
      <main>
        <Hero />
        <LogosSection />
        <ResultsSection />
        <ProblemSection />
        <SolutionSection />
        <ServicesSection />
        <CasesSection />
        <TestimonialsSection />
        <MethodFlowSection />
        <AboutSection />
        <OfferSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
