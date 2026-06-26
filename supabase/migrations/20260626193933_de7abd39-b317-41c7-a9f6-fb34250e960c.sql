UPDATE public.leads SET email = 'sem-email@placeholder.local' WHERE length(btrim(email)) = 0;
UPDATE public.leads SET phone = 'sem-telefone' WHERE length(btrim(phone)) = 0;
UPDATE public.leads SET name = 'Sem nome' WHERE length(btrim(name)) = 0;
UPDATE public.leads SET message = 'sem-mensagem' WHERE length(btrim(message)) = 0;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_phone_not_blank CHECK (length(btrim(phone)) > 0),
  ADD CONSTRAINT leads_email_not_blank CHECK (length(btrim(email)) > 0),
  ADD CONSTRAINT leads_name_not_blank CHECK (length(btrim(name)) > 0),
  ADD CONSTRAINT leads_message_not_blank CHECK (length(btrim(message)) > 0);