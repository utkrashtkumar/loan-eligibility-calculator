-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (anonymous users) to submit a contact form message
CREATE POLICY "Allow anonymous inserts" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Policy to allow only the administrator (handtohandloans@gmail.com) to view the messages
CREATE POLICY "Allow admin select" ON contact_messages
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'handtohandloans@gmail.com'
    );

-- Policy to allow only the administrator to delete messages
CREATE POLICY "Allow admin delete" ON contact_messages
    FOR DELETE USING (
        auth.jwt() ->> 'email' = 'handtohandloans@gmail.com'
    );
