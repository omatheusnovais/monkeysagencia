import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketingNews } from "@/lib/news.functions";


import { supabase } from "@/integrations/supabase/client";

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
  const [view, setView] = useState<"kanban" | "stats" | "news">("kanban");


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
    const fechados = all.filter((l) => l.status === "contrato_fechado");
    const receita = fechados.reduce((sum, l) => {
      const raw = l.message?.split("\n").find((line) => line.startsWith("Valor do contrato:"))?.split(":").slice(1).join(":").trim() ?? "";
      const num = Number(raw.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
      return sum + (isFinite(num) ? num : 0);
    }, 0);
    return {
      leads: all.filter((l) => l.status === "novos" || l.status === "em_contato").length,
      vendas: fechados.length,
      perdidos: all.filter((l) => l.status === "desqualificado").length,
      total: all.length,
      receita,
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

          {/* Tabs row */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card border border-border px-3 py-2">
            <div className="flex items-center gap-1">
              <TabBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutGrid className="size-4" />} label="KANBAN" />
              <TabBtn active={view === "stats"} onClick={() => setView("stats")} icon={<PieChart className="size-4" />} label="ESTATÍSTICAS" />
              <TabBtn active={view === "news"} onClick={() => setView("news")} icon={<Newspaper className="size-4" />} label="NOTÍCIAS" />
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
                {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
              </DragOverlay>
            </DndContext>
          )}

          {view === "stats" && (
            <StatsPanel
              vendas={totals.vendas}
              total={totals.total}
              receita={totals.receita}
            />
          )}


          {view === "news" && <NewsPanel />}


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

function StatsPanel({ vendas, total, receita }: { vendas: number; total: number; receita: number }) {
  const conv = total > 0 ? (vendas / total) * 100 : 0;
  const ticketMedio = vendas > 0 ? receita / vendas : 0;
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold font-display">Estatísticas</h2>
        <p className="text-sm text-muted-foreground">Métricas calculadas a partir dos contratos fechados.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border p-5">
          <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">TAXA DE CONVERSÃO</div>
          <div className="text-3xl font-bold mt-2">{conv.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">{vendas} de {total} leads</div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">TICKET MÉDIO</div>
          <div className="text-3xl font-bold mt-2">{fmt(ticketMedio)}</div>
          <div className="text-xs text-muted-foreground mt-1">Média dos {vendas} contrato(s) fechado(s)</div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="text-[11px] tracking-wider font-semibold text-muted-foreground">RECEITA TOTAL</div>
          <div className="text-3xl font-bold mt-2">{fmt(receita)}</div>
          <div className="text-xs text-muted-foreground mt-1">Soma dos contratos fechados</div>
        </div>
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

function Column({ col, leads }: { col: { key: Status; title: string; dot: string }; leads: Lead[] }) {
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
          leads.map((l) => <DraggableCard key={l.id} lead={l} />)
        )}
      </div>
    </div>
  );
}


function DraggableCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const movedRef = React.useRef(false);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        movedRef.current = false;
        listeners?.onPointerDown?.(e);
      }}
      onPointerMove={() => { movedRef.current = true; }}
      onClickCapture={(e) => {
        if (isDragging || movedRef.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
      className={isDragging ? "opacity-30" : ""}
    >
      <LeadCard lead={lead} />
    </div>
  );
}

function LeadCard({ lead, dragging }: { lead: Lead; dragging?: boolean }) {
  const qc = useQueryClient();
  const [detailOpen, setDetailOpen] = useState(false);
  const company = lead.message?.split("\n").find((line) => line.toLowerCase().includes("empresa"))?.split(":")[1]?.trim();
  const valorContrato = lead.message?.split("\n").find((line) => line.startsWith("Valor do contrato:"))?.split(":").slice(1).join(":").trim() ?? "";
  const dateStr = new Date(lead.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

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
              <DropdownMenuItem onSelect={remove} className="text-destructive">
                <Trash2 className="size-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {company && <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{company}</p>}
        <div className="space-y-1.5 text-xs text-muted-foreground mt-3">
          {lead.email && <div className="flex items-center gap-1.5"><Mail className="size-3.5 text-primary" /><span className="truncate">{lead.email}</span></div>}
          {lead.phone && <div className="flex items-center gap-1.5"><Phone className="size-3.5 text-emerald-500" />{lead.phone}</div>}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="font-bold">{valorContrato || "R$ 0,00"}</span>
          <span className="text-muted-foreground inline-flex items-center gap-1"><Calendar className="size-3" /> {dateStr}</span>
        </div>
      </div>
      {!dragging && <LeadDetailDialog lead={lead} open={detailOpen} onOpenChange={setDetailOpen} />}
    </>
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

type Note = { id: string; text: string; at: string; editedAt?: string };

function parseMessage(message: string | null): { fields: Record<string, string>; notes: Note[] } {
  const fields: Record<string, string> = {};
  let notes: Note[] = [];
  (message ?? "").split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx <= 0) return;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (!k || !v) return;
    if (k === "Notas") {
      try {
        const arr = JSON.parse(v);
        if (Array.isArray(arr)) notes = arr;
      } catch { /* ignore */ }
    } else {
      fields[k] = v;
    }
  });
  // Backward-compat: migrate single "Anotação" into the notes list
  const legacy = fields["Anotação"] ?? fields["Anotacao"];
  if (legacy && notes.length === 0) {
    notes = [{ id: crypto.randomUUID(), text: legacy, at: new Date().toISOString() }];
  }
  delete fields["Anotação"];
  delete fields["Anotacao"];
  return { fields, notes };
}

function serializeMessage(fields: Record<string, string>, notes: Note[]): string | null {
  const lines = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  if (notes.length) lines.push(`Notas: ${JSON.stringify(notes)}`);
  return lines.length ? lines.join("\n") : null;
}

function LeadDetailDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { fields: diagnostic, notes } = useMemo(() => parseMessage(lead.message), [lead.message]);

  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  async function persistNotes(nextNotes: Note[]) {
    setSavingNote(true);
    const { error } = await supabase.from("leads").update({
      message: serializeMessage(diagnostic, nextNotes),
    }).eq("id", lead.id);
    setSavingNote(false);
    if (error) { alert("Erro ao salvar anotação: " + error.message); return false; }
    qc.invalidateQueries({ queryKey: ["leads"] });
    return true;
  }

  async function addOrUpdateNote() {
    const text = noteDraft.trim();
    if (!text) return;
    let next: Note[];
    if (editingNoteId) {
      next = notes.map((n) => n.id === editingNoteId ? { ...n, text, editedAt: new Date().toISOString() } : n);
    } else {
      next = [...notes, { id: crypto.randomUUID(), text, at: new Date().toISOString() }];
    }
    const ok = await persistNotes(next);
    if (ok) { setNoteDraft(""); setEditingNoteId(null); }
  }

  async function deleteNote(id: string) {
    if (!confirm("Excluir esta anotação?")) return;
    await persistNotes(notes.filter((n) => n.id !== id));
    if (editingNoteId === id) { setEditingNoteId(null); setNoteDraft(""); }
  }

  function startEditNote(n: Note) {
    setEditingNoteId(n.id);
    setNoteDraft(n.text);
  }


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
  const initialForm = () => ({
    name: lead.name,
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    status: lead.status,
    company: diagnostic["Empresa"] ?? "",
    faturamento: diagnostic["Faturamento mensal"] ?? diagnostic["Faturamento"] ?? "",
    investimento: diagnostic["Investimento"] ?? "",
    valorContrato: diagnostic["Valor do contrato"] ?? "",
    inicioContrato: diagnostic["Início do contrato"] ?? "",
  });
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setEditing(false);
    setForm(initialForm());
    setNoteDraft("");
    setEditingNoteId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const valorContrato = diagnostic["Valor do contrato"] ?? "";
  const inicioContrato = diagnostic["Início do contrato"] ?? "";
  const vencimentoContrato = useMemo(() => {
    if (!inicioContrato) return "";
    const d = new Date(inicioContrato);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  }, [inicioContrato]);
  const fmtDate = (s: string) => {
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString("pt-BR");
  };

  async function saveEdit() {
    if (!form.name.trim()) return;
    setSaving(true);
    const fields: Record<string, string> = {};
    if (form.company.trim()) fields["Empresa"] = form.company.trim();
    if (form.faturamento.trim()) fields["Faturamento mensal"] = form.faturamento.trim();
    if (form.investimento.trim()) fields["Investimento"] = form.investimento.trim();
    if (form.valorContrato.trim()) fields["Valor do contrato"] = form.valorContrato.trim();
    if (form.inicioContrato.trim()) fields["Início do contrato"] = form.inicioContrato.trim();
    // Preserve any other diagnostic keys we don't edit explicitly
    const known = ["Empresa", "Faturamento mensal", "Faturamento", "Investimento", "Valor do contrato", "Início do contrato"];
    for (const [k, v] of Object.entries(diagnostic)) {
      if (!known.includes(k)) fields[k] = v;
    }
    const { error } = await supabase.from("leads").update({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
      message: serializeMessage(fields, notes),
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{editing ? "Editar lead" : lead.name}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input value={form.name} disabled />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">WhatsApp</Label>
                <Input value={form.phone} disabled />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} disabled />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Input value={COLUMNS.find((c) => c.key === form.status)?.title ?? form.status} disabled />
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Valor do contrato</Label>
                <Input placeholder="R$ 0,00" value={form.valorContrato} onChange={(e) => setForm({ ...form, valorContrato: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Início do contrato</Label>
                <Input type="date" value={form.inicioContrato} onChange={(e) => setForm({ ...form, inicioContrato: e.target.value })} />
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* COLUNA ESQUERDA */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field icon={<Mail className="size-3.5" />} label="Email" value={lead.email ?? "—"} />
                  <Field icon={<Phone className="size-3.5" />} label="WhatsApp / Telefone" value={lead.phone ?? "—"} />
                </div>

                {(() => {
                  const filtered = Object.entries(diagnostic).filter(([k]) => k !== "Valor do contrato" && k !== "Início do contrato");
                  return filtered.length > 0 && (
                    <div className="rounded-lg border border-border p-3 space-y-2">
                      <h4 className="text-xs font-semibold tracking-wider text-muted-foreground">RESPOSTAS DO DIAGNÓSTICO</h4>
                      {filtered.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 text-sm">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="font-medium text-right">{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {(valorContrato || inicioContrato || vencimentoContrato) && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <h4 className="text-xs font-semibold tracking-wider text-muted-foreground">CONTRATO</h4>
                    {valorContrato && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium text-right">{valorContrato}</span>
                      </div>
                    )}
                    {inicioContrato && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Início</span>
                        <span className="font-medium text-right">{fmtDate(inicioContrato)}</span>
                      </div>
                    )}
                    {vencimentoContrato && (
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Vencimento (90 dias)</span>
                        <span className="font-medium text-right">{fmtDate(vencimentoContrato)}</span>
                      </div>
                    )}
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
              </div>

              {/* COLUNA DIREITA - ANOTAÇÕES */}
              <div className="rounded-lg border border-border p-3 space-y-3 bg-[#ece5dd] dark:bg-muted/40 md:sticky md:top-0 h-full">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground">ANOTAÇÕES</h4>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma anotação ainda.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="flex justify-end">
                        <div className="group relative max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] dark:bg-emerald-900/40 px-3 py-2 shadow-sm">
                          <p className="text-sm whitespace-pre-wrap break-words text-foreground">{n.text}</p>
                          <div className="flex items-center justify-end gap-2 mt-1 text-[10px] text-muted-foreground">
                            {n.editedAt && <span className="italic">editado</span>}
                            <span>{new Date(n.at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="absolute -top-2 -left-2 hidden group-hover:flex gap-1">
                            <button type="button" onClick={() => startEditNote(n)}
                              className="size-6 rounded-full bg-background border border-border text-foreground flex items-center justify-center hover:bg-muted" title="Editar">
                              <Pencil className="size-3" />
                            </button>
                            <button type="button" onClick={() => deleteNote(n.id)}
                              className="size-6 rounded-full bg-background border border-border text-destructive flex items-center justify-center hover:bg-muted" title="Excluir">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-end gap-2 pt-1">
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={2}
                    placeholder={editingNoteId ? "Editar anotação..." : "Escreva uma anotação..."}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addOrUpdateNote(); }}
                    className="flex-1 rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <Button size="sm" onClick={addOrUpdateNote} disabled={savingNote || !noteDraft.trim()}>
                    {savingNote ? "..." : editingNoteId ? "Atualizar" : "Enviar"}
                  </Button>
                  {editingNoteId && (
                    <Button size="sm" variant="ghost" onClick={() => { setEditingNoteId(null); setNoteDraft(""); }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </div>

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


function NewsPanel() {
  const fetchNews = useServerFn(getMarketingNews);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["marketing-news"],
    queryFn: () => fetchNews(),
    staleTime: 1000 * 60 * 30,
  });
  const items = data?.items ?? [];
  return (
    <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display">Notícias do dia</h2>
          <p className="text-sm text-muted-foreground">Marketing e tráfego, atualizado das principais fontes do Brasil.</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`size-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>
      {isLoading && <div className="text-sm text-muted-foreground">Carregando notícias…</div>}
      {isError && <div className="text-sm text-destructive">Não foi possível carregar as notícias agora.</div>}
      {!isLoading && items.length === 0 && !isError && (
        <div className="text-sm text-muted-foreground">Nenhuma notícia encontrada no momento.</div>
      )}
      <ul className="divide-y divide-border">
        {items.map((n) => (
          <li key={n.link} className="py-3">
            <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium leading-snug group-hover:underline">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {n.source}{n.pubDate ? ` · ${new Date(n.pubDate).toLocaleDateString("pt-BR")}` : ""}
                </div>
              </div>
              <ExternalLink className="size-4 text-muted-foreground shrink-0 mt-1" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
