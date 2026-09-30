CREATE TYPE feedback_visibility AS ENUM ('private', 'shared');

CREATE TABLE feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES companies(id),
  author_id     uuid NOT NULL REFERENCES users(id),
  recipient_id  uuid NOT NULL REFERENCES users(id),
  body          text NOT NULL,
  visibility    feedback_visibility NOT NULL DEFAULT 'private',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX feedback_company_recipient_idx ON feedback (company_id, recipient_id);
