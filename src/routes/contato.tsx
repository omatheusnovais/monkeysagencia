import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contato")({
  component: ContactPage,
  head: () => ({ meta: [{ title: "Fale com a gente" }] }),
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

function ContactPage() {
  const [utms, setUtms] = useState<Record<string, string | null>>({});
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setUtms({
      utm_source: p.get("utm_source"),
      utm_medium: p.get("utm_medium"),
      utm_campaign: p.get("utm_campaign"),
      utm_term: p.get("utm_term"),
      utm_content: p.get("utm_content"),
    });
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      message: fd.get("message"),
    });
    if (!parsed.success) {
      setError("Verifique os dados do formulário");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.from("leads").insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      status: "novos",
      ...utms,
    });
    setLoading(false);
    if (err) { setError("Não foi possível enviar. Tente novamente."); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/50 backdrop-blur p-8">
        {sent ? (
          <div className="text-center py-8">
            <CheckCircle2 className="size-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Recebemos seu contato!</h2>
            <p className="text-muted-foreground">Em breve um especialista vai te chamar.</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Diagnóstico gratuito</h1>
            <p className="text-muted-foreground mb-6">Preencha abaixo e nosso time entra em contato.</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required maxLength={100} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" maxLength={255} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <Input id="phone" name="phone" maxLength={30} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Como podemos ajudar?</Label>
                <Textarea id="message" name="message" maxLength={1000} rows={4} />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Quero meu diagnóstico"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
