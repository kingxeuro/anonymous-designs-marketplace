# Admin Setup Instructions

Admin accounts cannot be created through the signup page for security reasons. Only you (the owner) can designate admin users.

## How to Make a User an Admin

### Step 1: Create a Regular Account
1. Sign up at `/auth/signup` as either a Designer or Brand Owner
2. Confirm your email
3. Note the email address you used

### Step 2: Promote to Admin via Database

Run this SQL query in your Supabase SQL Editor:

\`\`\`sql
-- Replace 'your-email@example.com' with the actual email address
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'your-email@example.com'
);
\`\`\`

### Step 3: Verify Admin Access
1. Log out and log back in
2. Navigate to `/admin`
3. You should now see the admin moderation panel

## Making Additional Admins

Repeat Step 2 for any other users you want to promote to admin. Only run this SQL query for trusted users who should have moderation privileges.

## Security Note

Never share your admin credentials or promote untrusted users to admin. Admins have full access to moderate all designs and view platform statistics.
