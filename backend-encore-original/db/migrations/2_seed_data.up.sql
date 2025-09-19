-- Insert demo company
INSERT INTO companies (id, name, website, phone, address, bcc_email) VALUES 
(1, 'Demo Company', 'https://demo.com', '+1-555-0123', '123 Demo Street, Demo City, DC 12345', 'demo-1-abc123@inbound.probyr.example');

-- Insert demo users
INSERT INTO users (id, company_id, email, first_name, last_name, role) VALUES 
(1, 1, 'admin@demo.com', 'Admin', 'User', 'admin'),
(2, 1, 'member@demo.com', 'Team', 'Member', 'member');

-- Insert default deal stages
INSERT INTO deal_stages (company_id, name, position, is_won, is_lost) VALUES 
(1, 'Lead', 1, FALSE, FALSE),
(1, 'Qualified', 2, FALSE, FALSE),
(1, 'Proposal', 3, FALSE, FALSE),
(1, 'Negotiation', 4, FALSE, FALSE),
(1, 'Won', 5, TRUE, FALSE),
(1, 'Lost', 6, FALSE, TRUE);

-- Insert demo tags
INSERT INTO tags (company_id, name, color) VALUES 
(1, 'Hot Lead', '#EF4444'),
(1, 'Enterprise', '#8B5CF6'),
(1, 'SMB', '#10B981'),
(1, 'Follow Up', '#F59E0B');

-- Insert demo people
INSERT INTO people (id, company_id, first_name, last_name, email, phone, job_title, last_contacted_at) VALUES 
(1, 1, 'John', 'Smith', 'john.smith@acme.com', '+1-555-0101', 'CEO', NOW() - INTERVAL '2 days'),
(2, 1, 'Sarah', 'Johnson', 'sarah.j@techcorp.com', '+1-555-0102', 'CTO', NOW() - INTERVAL '1 week'),
(3, 1, 'Mike', 'Davis', 'mike.davis@startup.io', '+1-555-0103', 'Founder', NOW() - INTERVAL '3 days'),
(4, 1, 'Lisa', 'Wilson', 'lisa.wilson@enterprise.com', '+1-555-0104', 'VP Sales', NOW() - INTERVAL '5 days'),
(5, 1, 'David', 'Brown', 'david.brown@company.net', '+1-555-0105', 'Director', NOW() - INTERVAL '1 day');

-- Insert demo deals
INSERT INTO deals (company_id, person_id, stage_id, title, value, expected_close_date, probability, notes) VALUES 
(1, 1, 2, 'Acme Corp - Enterprise License', 50000.00, CURRENT_DATE + INTERVAL '30 days', 75, 'High-value enterprise deal'),
(1, 2, 3, 'TechCorp Integration', 25000.00, CURRENT_DATE + INTERVAL '45 days', 60, 'Technical integration project'),
(1, 3, 1, 'Startup Package', 5000.00, CURRENT_DATE + INTERVAL '15 days', 40, 'Small startup, price sensitive'),
(1, 4, 4, 'Enterprise Sales Tools', 75000.00, CURRENT_DATE + INTERVAL '60 days', 80, 'Large enterprise opportunity'),
(1, 5, 1, 'Company.net Consultation', 10000.00, CURRENT_DATE + INTERVAL '20 days', 30, 'Initial consultation phase');

-- Insert demo tasks
INSERT INTO tasks (company_id, assigned_to, person_id, deal_id, title, description, due_date, is_completed) VALUES 
(1, 1, 1, 1, 'Follow up on proposal', 'Send follow-up email about enterprise license proposal', CURRENT_DATE, FALSE),
(1, 2, 2, 2, 'Technical review call', 'Schedule technical architecture review with CTO', CURRENT_DATE + INTERVAL '2 days', FALSE),
(1, 1, 3, 3, 'Price discussion', 'Discuss pricing options for startup package', CURRENT_DATE - INTERVAL '1 day', TRUE),
(1, 1, 4, 4, 'Contract preparation', 'Prepare enterprise contract for review', CURRENT_DATE + INTERVAL '3 days', FALSE),
(1, 2, 5, 5, 'Discovery call', 'Initial discovery call to understand requirements', CURRENT_DATE + INTERVAL '1 day', FALSE);

-- Insert demo activities
INSERT INTO activities (company_id, user_id, person_id, deal_id, activity_type, title, description) VALUES 
(1, 1, 1, 1, 'email', 'Sent proposal email', 'Sent enterprise license proposal to John Smith'),
(1, 1, 2, 2, 'call', 'Discovery call completed', 'Had 45-minute discovery call with Sarah Johnson'),
(1, 2, 3, 3, 'meeting', 'In-person meeting', 'Met with Mike Davis at coffee shop to discuss needs'),
(1, 1, 4, 4, 'email', 'Pricing information sent', 'Sent detailed pricing breakdown to Lisa Wilson'),
(1, 2, 5, 5, 'note', 'Contact attempt', 'Left voicemail for David Brown');

-- Insert demo contact tags
INSERT INTO contact_tags (person_id, tag_id) VALUES 
(1, 1), -- John Smith - Hot Lead
(1, 2), -- John Smith - Enterprise
(2, 2), -- Sarah Johnson - Enterprise
(3, 3), -- Mike Davis - SMB
(4, 1), -- Lisa Wilson - Hot Lead
(4, 2), -- Lisa Wilson - Enterprise
(5, 4); -- David Brown - Follow Up
