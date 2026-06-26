import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getDailyQuote } from "@/lib/quotes";
import { getMarketingNews } from "@/lib/news.functions";

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Plus,
  Tag,
  Trash2,
  Pencil,
  Mail,
  Phone,
  MoreVertical,
  LayoutGrid,
  PieChart,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  List,
  Bell,
  Sun,
  Moon,
  Calendar,
  Quote,
  Newspaper,
  ExternalLink,

} from "lucide-react";

export const Route = createFileRoute("/crm")({
  component: CrmPage,
  head: () => ({ meta: [{ title: "CRM · Admin" }] }),
});

type Status = "novos" | "em_contato" | "contrato_fechado" | "desqualificado";
type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: Status;
  label_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  position: number;
  created_at: string;
};
type LabelRow = { id: string; name: string; color: string };

const COLUMNS: { key: Status; title: string; dot: string }[] = [
  { key: "novos", title: "NOVO", dot: "#3b82f6" },
  { key: "em_contato", title: "EM CONTATO", dot: "#f59e0b" },
  { key: "contrato_fechado", title: "GANHO", dot: "#10b981" },
  { key: "desqualificado", title: "DESQUALIFICADO", dot: "#64748b" },
];

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    // Padrão: modo claro. Respeita escolha do usuário apenas se já estiver salva.
    const saved = localStorage.getItem("crm-theme") as "light" | "dark" | null;
    if (!saved) localStorage.setItem("crm-theme", "light");
    setTheme(saved ?? "light");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    localStorage.setItem("crm-theme", theme);
    return () => { document.documentElement.classList.remove("theme-light"); };
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) };
}


function CrmPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "stats">("kanban");
  const { theme, toggle } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/login" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const leadsQ = useQuery({
    queryKey: ["leads"],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });


  useEffect(() => {
    if (!ready) return;
    const ch = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [ready, qc]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const filtered = useMemo(() => {
    const list = leadsQ.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((l) => l.name?.toLowerCase().includes(q));
  }, [leadsQ.data, search]);

  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("crm-leads-last-seen") || 0);
  });
  const unread = useMemo(() => {
    return (leadsQ.data ?? []).filter((l) => new Date(l.created_at).getTime() > lastSeen).length;
  }, [leadsQ.data, lastSeen]);
  function markSeen() {
    const now = Date.now();
    localStorage.setItem("crm-leads-last-seen", String(now));
    setLastSeen(now);
  }

  const grouped = useMemo(() => {
    const map: Record<Status, Lead[]> = { novos: [], em_contato: [], contrato_fechado: [], desqualificado: [] };
    filtered.forEach((l) => map[l.status].push(l));
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const all = leadsQ.data ?? [];
    return {
      leads: all.filter((l) => l.status === "novos" || l.status === "em_contato").length,
      vendas: all.filter((l) => l.status === "contrato_fechado").length,
      perdidos: all.filter((l) => l.status === "desqualificado").length,
      total: all.length,
    };
  }, [leadsQ.data]);

  const moveMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("leads").update({ status, position: Date.now() }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["leads"] });
      const prev = qc.getQueryData<Lead[]>(["leads"]);
      qc.setQueryData<Lead[]>(["leads"], (old) => old?.map((l) => (l.id === id ? { ...l, status } : l)) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(["leads"], ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  function onDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)); }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const newStatus = overId as Status;
    const current = leadsQ.data?.find((l) => l.id === id);
    if (!current || current.status === newStatus) return;
    moveMut.mutate({ id, status: newStatus });
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  const activeLead = activeId ? leadsQ.data?.find((l) => l.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-[260px]">
            <h1 className="text-xl font-bold tracking-tight font-display">Funil de Vendas</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Principal</span>
          </div>
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome..."
                className="pl-9 rounded-full bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NewLeadDialog />
            <button onClick={toggle} className="size-9 rounded-full hover:bg-muted flex items-center justify-center" title="Alternar tema">
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <button onClick={markSeen} className="relative size-9 rounded-full hover:bg-muted flex items-center justify-center" title={`${unread} novos leads`}>
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <button onClick={logout} className="size-9 rounded-full hover:bg-muted flex items-center justify-center" title="Sair">
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-5 overflow-auto">
          {/* Breadcrumb chips */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0f1729] text-white">CRM</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-card border border-border text-foreground">
              FUNIL PRINCIPAL
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard color="#3b82f6" label="LEADS" value={String(totals.leads)} active />
            <KpiCard color="#10b981" label="VENDAS" value={String(totals.vendas)} />
            <KpiCard color="#94a3b8" label="PERDIDOS" value={String(totals.perdidos)} />
            <KpiCard color="#0f5132" label="FATURAMENTO" value="R$ 0" />
          </div>

          {/* Frase do dia + Notícias */}
          <DailyPanel />


          {/* Tabs row */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card border border-border px-3 py-2">
            <div className="flex items-center gap-1">
              <TabBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutGrid className="size-4" />} label="KANBAN" />
              <TabBtn active={view === "stats"} onClick={() => setView("stats")} icon={<Newspaper className="size-4" />} label="NOTÍCIAS" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full"><Filter className="size-4 mr-1" /> FILTRAR</Button>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => qc.invalidateQueries({ queryKey: ["leads"] })}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          {/* Kanban */}
          {view === "kanban" && (
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <div className="rounded-2xl bg-card border border-border p-4">
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {COLUMNS.map((col) => (
                    <div key={col.key} className="w-[300px] shrink-0">
                      <Column col={col} leads={grouped[col.key]} />
                    </div>
                  ))}
                </div>
              </div>
              <DragOverlay>
                {activeLead ? <LeadCard lead={activeLead} labels={labelsQ.data ?? []} dragging /> : null}
              </DragOverlay>
            </DndContext>
          )}

          {view === "stats" && (
            <NewsPanel />
          )}
        </main>
      </div>
    </div>
  );
}

function KpiCard({ color, label, value, active }: { color: string; label: string; value: string; active?: boolean }) {
  return (
    <div className={`rounded-2xl bg-card border ${active ? "border-[#0f5132]" : "border-border"} px-5 py-4 flex items-center gap-4`}>
      <span className="size-10 rounded-full shrink-0" style={{ background: color }} />
      <div className="min-w-0">
        <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold leading-tight">{value}</div>
      </div>
    </div>
  );
}

function DailyPanel() {
  const fetchNews = useServerFn(getMarketingNews);
  const quote = useMemo(() => getDailyQuote(), []);
  const newsQ = useQuery({
    queryKey: ["marketing-news"],
    queryFn: () => fetchNews({}),
    staleTime: 1000 * 60 * 60 * 6, // 6h
  });
  const items = newsQ.data?.items ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl bg-card border border-border p-5 lg:col-span-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground mb-3">
          <Quote className="size-3.5" /> FRASE DO DIA
        </div>
        <p className="text-base leading-relaxed italic text-foreground">"{quote.text}"</p>
        <p className="text-xs text-muted-foreground mt-2">— {quote.author}</p>
      </div>

      <div className="rounded-2xl bg-card border border-border p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground">
            <Newspaper className="size-3.5" /> NOTÍCIAS DE MARKETING & TRÁFEGO
          </div>
          {newsQ.isFetching && <RefreshCw className="size-3 animate-spin text-muted-foreground" />}
        </div>
        {newsQ.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem notícias disponíveis no momento.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((n, i) => (
              <li key={i}>
                <a href={n.link} target="_blank" rel="noreferrer"
                  className="group flex items-start gap-2 text-sm hover:text-primary transition-colors">
                  <ExternalLink className="size-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  <span className="flex-1">
                    <span className="line-clamp-2">{n.title}</span>
                    <span className="text-[11px] text-muted-foreground">{n.source}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider inline-flex items-center gap-2 transition ${active ? "bg-background shadow-sm border border-border" : "text-muted-foreground hover:bg-muted"}`}
    >
      {icon} {label}
    </button>
  );
}

function Column({ col, leads, labels }: { col: { key: Status; title: string; dot: string }; leads: Lead[]; labels: LabelRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div ref={setNodeRef} className={`flex flex-col min-h-[60vh] rounded-xl transition-colors ${isOver ? "bg-primary/5" : ""}`}>
      <div className="px-1 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: col.dot }} />
          <h2 className="font-bold text-xs tracking-wider">{col.title}</h2>
        </div>
        <Badge variant="outline" className="rounded-full">{leads.length}</Badge>
      </div>
      <div className="flex-1 space-y-3 pt-2">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-xs text-muted-foreground text-center">
            Solte cards aqui
          </div>
        ) : (
          leads.map((l) => <DraggableCard key={l.id} lead={l} labels={labels} />)
        )}
      </div>
    </div>
  );
}

function NewsPanel() {
  const fetchNews = useServerFn(getMarketingNews);
  const newsQ = useQuery({
    queryKey: ["marketing-news"],
    queryFn: () => fetchNews({}),
    staleTime: 1000 * 60 * 60 * 6,
  });
  const items = newsQ.data?.items ?? [];
  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider text-muted-foreground">
          <Newspaper className="size-3.5" /> NOTÍCIAS DE MARKETING & TRÁFEGO
        </div>
        {newsQ.isFetching && <RefreshCw className="size-3 animate-spin text-muted-foreground" />}
      </div>
      {newsQ.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem notícias disponíveis no momento.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((n, i) => (
            <li key={i}>
              <a href={n.link} target="_blank" rel="noreferrer"
                className="group flex items-start gap-2 text-sm hover:text-primary transition-colors">
                <ExternalLink className="size-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                <span className="flex-1">
                  <span className="line-clamp-2">{n.title}</span>
                  <span className="text-[11px] text-muted-foreground">{n.source}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DraggableCard({ lead, labels }: { lead: Lead; labels: LabelRow[] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-30" : ""}>
      <LeadCard lead={lead} labels={labels} />
    </div>
  );
}

function LeadCard({ lead, labels, dragging }: { lead: Lead; labels: LabelRow[]; dragging?: boolean }) {
  const qc = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const label = labels.find((l) => l.id === lead.label_id);
  const company = lead.message?.split("\n").find((line) => line.toLowerCase().includes("empresa"))?.split(":")[1]?.trim();
  const dateStr = new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  async function setLabel(label_id: string | null) {
    await supabase.from("leads").update({ label_id }).eq("id", lead.id);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }
  async function remove() {
    if (!confirm("Excluir este lead?")) return;
    await supabase.from("leads").delete().eq("id", lead.id);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <>
      <div
        onClick={() => { if (!dragging) setDetailOpen(true); }}
        className={`rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md transition cursor-grab active:cursor-grabbing ${dragging ? "shadow-2xl ring-2 ring-primary/50" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-sm uppercase tracking-wide truncate font-display">{lead.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
              <button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-muted rounded" aria-label="Ações"><MoreVertical className="size-4" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setLabel(null)}>Sem etiqueta</DropdownMenuItem>
              {labels.map((l) => (
                <DropdownMenuItem key={l.id} onSelect={() => setLabel(l.id)}>
                  <span className="size-2 rounded-full mr-2" style={{ background: l.color }} />{l.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={remove} className="text-destructive">
                <Trash2 className="size-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {company && <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{company}</p>}
        {label && (
          <Badge style={{ backgroundColor: label.color + "22", color: label.color, borderColor: label.color + "55" }} variant="outline" className="mt-2">
            <Tag className="size-3 mr-1" />{label.name}
          </Badge>
        )}
        <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
          {lead.email && <div className="flex items-center gap-1.5"><Mail className="size-3.5 text-primary" /><span className="truncate">{lead.email}</span></div>}
          {lead.phone && <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-emerald-500" />{lead.phone}</div>}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="font-bold">R$ 0,00</span>
          <span className="text-muted-foreground inline-flex items-center gap-1"><Calendar className="size-3" /> {dateStr}</span>
        </div>
      </div>
      {!dragging && <LeadDetailDialog lead={lead} labels={labels} open={detailOpen} onOpenChange={setDetailOpen} />}
    </>
  );
}


function LabelsManager({ labels }: { labels: LabelRow[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LabelRow | null>(null);
  const [name, setName] = useState("");
  const DEFAULT_COLOR = "#ffcc00";

  function startNew() { setEditing(null); setName(""); }
  function startEdit(l: LabelRow) { setEditing(l); setName(l.name); }

  async function save() {
    if (!name.trim()) return;
    if (editing) {
      await supabase.from("labels").update({ name: name.trim() }).eq("id", editing.id);
    } else {
      await supabase.from("labels").insert({ name: name.trim(), color: DEFAULT_COLOR });
    }
    qc.invalidateQueries({ queryKey: ["labels"] });
    startNew();
  }
  async function remove(id: string) {
    if (!confirm("Excluir etiqueta?")) return;
    await supabase.from("labels").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["labels"] });
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) startNew(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full"><Tag className="size-4 mr-1" /> ETIQUETAS</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Gerenciar etiquetas</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {labels.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma etiqueta criada.</p>}
          {labels.map((l) => (
            <div key={l.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
              <span className="size-4 rounded" style={{ background: l.color }} />
              <span className="flex-1 text-sm">{l.name}</span>
              <Button size="sm" variant="ghost" onClick={() => startEdit(l)}><Pencil className="size-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="size-3.5 text-destructive" /></Button>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="text-sm font-semibold">{editing ? "Editar etiqueta" : "Nova etiqueta"}</h3>
          <div className="space-y-1.5">
            <Label htmlFor="lname" className="text-xs">Nome</Label>
            <Input id="lname" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} onKeyDown={(e) => e.key === "Enter" && save()} />
          </div>
          <DialogFooter className="gap-2">
            {editing && <Button variant="ghost" onClick={startNew}>Cancelar</Button>}
            <Button onClick={save}><Plus className="size-4 mr-1" /> {editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewLeadDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const empty = { name: "", email: "", phone: "", company: "", faturamento: "", note: "" };
  const [form, setForm] = useState(empty);

  function reset() { setForm(empty); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const lines: string[] = [];
    if (form.company.trim()) lines.push(`Empresa: ${form.company.trim()}`);
    if (form.faturamento.trim()) lines.push(`Faturamento mensal: ${form.faturamento.trim()}`);
    if (form.note.trim()) lines.push(`Anotação: ${form.note.trim()}`);
    const { error } = await supabase.from("leads").insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      message: lines.length ? lines.join("\n") : null,
      status: "novos",
    });
    setSaving(false);
    if (error) { alert("Erro ao criar lead: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["leads"] });
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="size-4 mr-1" /> NOVO LEAD
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Cadastrar lead manualmente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nl-name" className="text-xs">Nome *</Label>
            <Input id="nl-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-phone" className="text-xs">WhatsApp / Telefone</Label>
            <Input id="nl-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-email" className="text-xs">Email</Label>
            <Input id="nl-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-company" className="text-xs">Empresa</Label>
            <Input id="nl-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-fat" className="text-xs">Faturamento mensal</Label>
            <Input id="nl-fat" value={form.faturamento} onChange={(e) => setForm({ ...form, faturamento: e.target.value })} placeholder="Ex.: R$10k–30k" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nl-note" className="text-xs">Anotação</Label>
            <textarea
              id="nl-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Observações internas sobre o lead"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            <Plus className="size-4 mr-1" /> {saving ? "Salvando..." : "Criar lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadDetailDialog({ lead, labels, open, onOpenChange }: { lead: Lead; labels: LabelRow[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const label = labels.find((l) => l.id === lead.label_id);
  const parsed: Record<string, string> = {};
  (lead.message ?? "").split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k && v) parsed[k] = v;
    }
  });
  const utms = [
    ["utm_source", lead.utm_source],
    ["utm_medium", lead.utm_medium],
    ["utm_campaign", lead.utm_campaign],
    ["utm_term", lead.utm_term],
    ["utm_content", lead.utm_content],
  ].filter(([, v]) => v) as [string, string][];
  const statusTitle = COLUMNS.find((c) => c.key === lead.status)?.title ?? lead.status;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: lead.name,
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    status: lead.status,
    label_id: lead.label_id ?? "",
    company: parsed["Empresa"] ?? "",
    faturamento: parsed["Faturamento mensal"] ?? parsed["Faturamento"] ?? "",
    investimento: parsed["Investimento"] ?? "",
    note: parsed["Anotação"] ?? parsed["Anotacao"] ?? "",
  });

  useEffect(() => {
    setEditing(false);
    const p: Record<string, string> = {};
    (lead.message ?? "").split("\n").forEach((line) => {
      const i = line.indexOf(":");
      if (i > 0) {
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k && v) p[k] = v;
      }
    });
    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      status: lead.status,
      label_id: lead.label_id ?? "",
      company: p["Empresa"] ?? "",
      faturamento: p["Faturamento mensal"] ?? p["Faturamento"] ?? "",
      investimento: p["Investimento"] ?? "",
      note: p["Anotação"] ?? p["Anotacao"] ?? "",
    });
  }, [lead]);

  async function saveEdit() {
    if (!form.name.trim()) return;
    setSaving(true);
    const lines: string[] = [];
    if (form.company.trim()) lines.push(`Empresa: ${form.company.trim()}`);
    if (form.faturamento.trim()) lines.push(`Faturamento mensal: ${form.faturamento.trim()}`);
    if (form.investimento.trim()) lines.push(`Investimento: ${form.investimento.trim()}`);
    if (form.note.trim()) lines.push(`Anotação: ${form.note.trim()}`);
    const { error } = await supabase.from("leads").update({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      label_id: form.label_id || null,
      message: lines.length ? lines.join("\n") : null,
    }).eq("id", lead.id);
    setSaving(false);
    if (error) { alert("Erro ao salvar: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["leads"] });
    setEditing(false);
  }

  async function remove() {
    if (!confirm("Excluir este lead?")) return;
    const { error } = await supabase.from("leads").delete().eq("id", lead.id);
    if (error) { alert("Erro ao excluir: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["leads"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Editar lead" : lead.name}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Lead["status"] })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Etiqueta</Label>
                <select value={form.label_id} onChange={(e) => setForm({ ...form, label_id: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                  <option value="">Sem etiqueta</option>
                  {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Faturamento mensal</Label>
                <Input value={form.faturamento} onChange={(e) => setForm({ ...form, faturamento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Investimento</Label>
                <Input value={form.investimento} onChange={(e) => setForm({ ...form, investimento: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Anotação</Label>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={saving || !form.name.trim()}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted">{statusTitle}</span>
              {label && (
                <span className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                  style={{ backgroundColor: label.color + "22", color: label.color }}>
                  <Tag className="size-3" />{label.name}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={<Mail className="size-3.5" />} label="Email" value={lead.email ?? "—"} />
              <Field icon={<Phone className="size-3.5" />} label="WhatsApp / Telefone" value={lead.phone ?? "—"} />
            </div>

            {Object.keys(parsed).length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground">RESPOSTAS DO DIAGNÓSTICO</h4>
                {Object.entries(parsed).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium text-right">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {utms.length > 0 && (
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground">ORIGEM (UTMs)</h4>
                {utms.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-mono">{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Criado em {new Date(lead.created_at).toLocaleString("pt-BR")}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="outline" onClick={remove} className="text-destructive hover:text-destructive">
                <Trash2 className="size-3.5 mr-1" /> Excluir
              </Button>
              {lead.phone && (
                <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-500 text-white hover:bg-emerald-600">
                  <Phone className="size-3.5" /> WhatsApp
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                  <Mail className="size-3.5" /> Email
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[11px] font-semibold tracking-wider text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-1 text-sm break-words">{value}</div>
    </div>
  );
}

