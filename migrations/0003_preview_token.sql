-- Preview sessions (parent "try child mode") must not steal the tablet pairing.
alter table children add column if not exists preview_token_hash text;
