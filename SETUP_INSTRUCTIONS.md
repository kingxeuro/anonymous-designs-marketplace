# Anonymous Designs - Setup Instructions

Follow these steps to get Anonymous Designs running:

## 1. Run Database Scripts

In your Supabase SQL Editor, run these scripts **in order**:

### Required Scripts:
1. **001_create_schema.sql** - Creates all tables and RLS policies
2. **007_fix_foreign_key.sql** - **IMPORTANT: Fixes the profile creation issue**

### Optional Scripts:
- **002_seed_data.sql** - Adds sample data for testing

## 2. Test the Application

### Sign Up Flow:
1. Go to `/auth/signup`
2. Create an account as Designer or Brand Owner
3. Check your email and confirm
4. Log in at `/auth/login`
5. You should be redirected to your dashboard

### Verify Profile Creation:
After signup, check in Supabase that:
- Your user exists in `auth.users`
- Your profile exists in `public.profiles`
- The profile has the correct role and display name

## 3. Create Admin Account

To access the admin panel:

1. Sign up with your email
2. In Supabase SQL Editor, run:
\`\`\`sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'your-email@example.com'
);
\`\`\`
3. Log out and log back in
4. Access admin panel at `/admin`

## 4. Enable Middleware (Optional)

Once everything is working, you can re-enable the middleware for route protection:

1. Open `middleware.ts`
2. Uncomment the middleware code
3. Test that protected routes work correctly

## Troubleshooting

### "Foreign key constraint" error:
- Make sure you ran `007_fix_foreign_key.sql`
- This script removes the problematic foreign key constraint
- Log out and try signing up again

### Profile not created:
- Check that the database trigger exists
- Run `007_fix_foreign_key.sql` which recreates the trigger
- Try logging out and back in

### Can't access admin panel:
- Make sure you ran the SQL command to set your role to 'admin'
- Log out and log back in after changing your role

## Next Steps

Once everything is working:
1. Test the designer upload flow
2. Test the marketplace browsing
3. Test the admin moderation panel
4. Add Stripe integration for payments (optional)
