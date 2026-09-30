CREATE TABLE goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id),
  owner_id    uuid NOT NULL REFERENCES users(id),
  title       text NOT NULL,
  progress    integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_company_owner_idx ON goals (company_id, owner_id);
