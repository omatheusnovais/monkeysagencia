import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/admin/crm")({
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

const COLUMNS: { key: Status; title: string; accent: string }[] = [
  { key: "novos", title: "Novos", accent: "from-blue-500/20 to-blue-500/0" },
  { key: "em_contato", title: "Em contato", accent: "from-amber-500/20 to-amber-500/0" },
  { key: "contrato_fechado", title: "Contrato fechado", accent: "from-emerald-500/20 to-emerald-500/0" },
  { key: "desqualificado", title: "Desqualificado", accent: "from-rose-500/20 to-rose-500/0" },
];

function CrmPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/admin/login" });
      else setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/admin/login" });
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

  const labelsQ = useQuery({
    queryKey: ["labels"],
    enabled: ready,
    queryFn: async () => {
      const { data, error } = await supabase.from("labels").select("*").order("name");
      if (error) throw error;
      return data as LabelRow[];
    },
  });

  // Realtime: refetch on lead changes
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

  const grouped = useMemo(() => {
    const map: Record<Status, Lead[]> = { novos: [], em_contato: [], contrato_fechado: [], desqualificado: [] };
    (leadsQ.data ?? []).forEach((l) => map[l.status].push(l));
    return map;
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
    navigate({ to: "/admin/login" });
  }

  if (!ready) return <div className="min-h-screen bg-background" />;

  const activeLead = activeId ? leadsQ.data?.find((l) => l.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-purple-500" />
            <div>
              <h1 className="text-lg font-bold leading-none">CRM Admin</h1>
              <p className="text-xs text-muted-foreground mt-1">{leadsQ.data?.length ?? 0} leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LabelsManager labels={labelsQ.data ?? []} />
            <Link to="/contato" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm"><ExternalLink className="size-4 mr-1" /> Formulário</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}><LogOut className="size-4 mr-1" /> Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <Column key={col.key} col={col} leads={grouped[col.key]} labels={labelsQ.data ?? []} />
            ))}
          </div>
          <DragOverlay>
            {activeLead ? <LeadCard lead={activeLead} labels={labelsQ.data ?? []} dragging /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
}

function Column({ col, leads, labels }: { col: { key: Status; title: string; accent: string }; leads: Lead[]; labels: LabelRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-border bg-card/30 backdrop-blur flex flex-col min-h-[60vh] transition-colors ${isOver ? "bg-primary/5 border-primary/40" : ""}`}
    >
      <div className={`px-4 py-3 border-b border-border bg-gradient-to-b ${col.accent} rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{col.title}</h2>
          <Badge variant="secondary">{leads.length}</Badge>
        </div>
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Arraste cards para cá</p>
        ) : (
          leads.map((l) => <DraggableCard key={l.id} lead={l} labels={labels} />)
        )}
      </div>
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
  const label = labels.find((l) => l.id === lead.label_id);
  const hasUtm = lead.utm_source || lead.utm_medium || lead.utm_campaign;

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
    <div className={`rounded-xl border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${dragging ? "shadow-2xl ring-2 ring-primary/50" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
          {label && (
            <Badge style={{ backgroundColor: label.color + "22", color: label.color, borderColor: label.color + "55" }} variant="outline" className="mt-1">
              <Tag className="size-3 mr-1" />{label.name}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onPointerDown={(e) => e.stopPropagation()}>
            <button className="p-1 hover:bg-accent rounded" aria-label="Ações"><MoreVertical className="size-4" /></button>
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
      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.email && <div className="flex items-center gap-1.5"><Mail className="size-3" /><span className="truncate">{lead.email}</span></div>}
        {lead.phone && <div className="flex items-center gap-1.5"><Phone className="size-3" />{lead.phone}</div>}
      </div>
      {lead.message && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{lead.message}</p>}
      {hasUtm && (
        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-1">
          {lead.utm_source && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">src: {lead.utm_source}</span>}
          {lead.utm_medium && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">med: {lead.utm_medium}</span>}
          {lead.utm_campaign && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">cmp: {lead.utm_campaign}</span>}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">{new Date(lead.created_at).toLocaleString("pt-BR")}</p>
    </div>
  );
}

function LabelsManager({ labels }: { labels: LabelRow[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LabelRow | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");

  function startNew() { setEditing(null); setName(""); setColor("#6366f1"); }
  function startEdit(l: LabelRow) { setEditing(l); setName(l.name); setColor(l.color); }

  async function save() {
    if (!name.trim()) return;
    if (editing) {
      await supabase.from("labels").update({ name: name.trim(), color }).eq("id", editing.id);
    } else {
      await supabase.from("labels").insert({ name: name.trim(), color });
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
        <Button variant="outline" size="sm"><Tag className="size-4 mr-1" /> Etiquetas</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar etiquetas</DialogTitle>
        </DialogHeader>
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
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="lname" className="text-xs">Nome</Label>
              <Input id="lname" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lcolor" className="text-xs">Cor</Label>
              <input id="lcolor" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded border border-border bg-transparent cursor-pointer" />
            </div>
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
