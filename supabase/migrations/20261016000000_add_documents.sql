-- Standalone quotations and invoices — unlike order-bound invoices/quotation
-- emails (order-documents.ts), these aren't tied to an order and don't need
-- a registered customer: `customer_id` is optional, `recipient_name`/
-- `recipient_email` cover anyone else. One `type` column (quotation|invoice)
-- rather than two tables, since a quotation naturally becomes an invoice
-- later (see `converted_from_document_id`) and both share line items and
-- totals math.

CREATE TABLE IF NOT EXISTS public.documents (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id                 uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type                        text NOT NULL CHECK (type IN ('quotation', 'invoice')),
  document_number             text NOT NULL,
  customer_id                 uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  recipient_name              text NOT NULL,
  recipient_email             text,
  status                      text NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'paid', 'partially_paid', 'overdue', 'void')),
  issue_date                  date NOT NULL DEFAULT CURRENT_DATE,
  valid_until                 date,
  due_date                    date,
  description                 text,
  notes                       text,
  subtotal                    numeric NOT NULL DEFAULT 0,
  tax_rate                    numeric NOT NULL DEFAULT 0,
  tax_amount                  numeric NOT NULL DEFAULT 0,
  total                       numeric NOT NULL DEFAULT 0,
  amount_paid                 numeric NOT NULL DEFAULT 0,
  order_id                    uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  converted_from_document_id  uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  created_by                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  description   text NOT NULL,
  quantity      numeric NOT NULL DEFAULT 1,
  unit_price    numeric NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_payments (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  amount        numeric NOT NULL,
  method        text,
  notes         text,
  paid_at       timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_business_id ON public.documents(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON public.documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_document_items_document_id ON public.document_items(document_id);
CREATE INDEX IF NOT EXISTS idx_document_payments_document_id ON public.document_payments(document_id);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON public.documents;
CREATE POLICY tenant_isolation ON public.documents
  USING (business_id IN (SELECT public.my_business_ids()));

DROP POLICY IF EXISTS tenant_isolation ON public.document_items;
CREATE POLICY tenant_isolation ON public.document_items
  USING (business_id IN (SELECT public.my_business_ids()));

DROP POLICY IF EXISTS tenant_isolation ON public.document_payments;
CREATE POLICY tenant_isolation ON public.document_payments
  USING (business_id IN (SELECT public.my_business_ids()));
