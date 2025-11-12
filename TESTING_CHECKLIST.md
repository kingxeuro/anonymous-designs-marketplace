# Anonymous Designs - Testing Checklist

## Complete Flow Test: Design Submission to Admin Approval

### Prerequisites
1. **Run SQL Scripts** (in order):
   - `001_create_schema.sql` - Creates tables and initial RLS policies
   - `007_fix_foreign_key.sql` - Fixes profile creation issues
   - `008_ensure_rls_policies.sql` - **CRITICAL: Ensures admin can see/moderate designs**

2. **Create Test Accounts**:
   - Designer account (email: designer@test.com)
   - Admin account (email: admin@test.com)

### Step-by-Step Testing

#### Part 1: Designer Uploads Design
1. Sign up as a designer at `/auth/signup`
   - Choose "Designer" role
   - Use alias like "DesignPro"
   - Confirm email
2. Log in and go to `/dashboard/designer`
3. Click "Upload New Design"
4. Fill out the form:
   - Title: "Test Design 1"
   - Description: "A test design for approval"
   - Upload an image file (PNG/JPG)
   - Price Non-Exclusive: $50
   - Price Exclusive: $200
   - Tags: "streetwear, graphic"
5. Click "Upload Design"
6. **Expected Result**: 
   - Success message appears
   - Redirected to designer dashboard
   - Design shows with "pending" badge
   - Stats show "1" in Pending Review

#### Part 2: Admin Views Pending Design
1. Sign up as admin at `/auth/signup` (choose any role)
2. Run SQL to promote to admin:
   \`\`\`sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE id = (
     SELECT id 
     FROM auth.users 
     WHERE email = 'admin@test.com'
   );
   \`\`\`
3. Log out and log back in
4. Go to `/admin`
5. **Expected Result**:
   - Platform stats show "1" total design
   - "Pending Review" tab shows "1" badge
   - Design appears in moderation queue with:
     - Preview image
     - Title "Test Design 1"
     - Designer alias "DesignPro"
     - Both prices displayed
     - "Approve" and "Reject" buttons visible

#### Part 3: Admin Approves Design
1. In admin panel, click "Approve" button
2. **Expected Result**:
   - Design disappears from "Pending Review" tab
   - Design appears in "All Designs" tab with "approved" badge
   - Platform stats update: "1" approved design

#### Part 4: Design Appears in Marketplace
1. Go to `/marketplace` (can be logged out)
2. **Expected Result**:
   - Approved design appears in marketplace grid
   - Shows preview image, title, prices
   - Designer shown as "DesignPro" (anonymous)
   - Can click to view details

#### Part 5: Designer Sees Approval
1. Log in as designer
2. Go to `/dashboard/designer`
3. **Expected Result**:
   - Design now shows "approved" badge (green)
   - Stats show "1" approved design
   - Design is visible in the grid

---

## Common Issues & Solutions

### Issue: Admin can't see pending designs
**Solution**: Run `008_ensure_rls_policies.sql` to fix RLS policies

### Issue: Design upload fails with "Not authenticated"
**Solution**: Make sure you're logged in and have a profile created

### Issue: Image upload fails
**Solution**: Check that Vercel Blob integration is connected

### Issue: "Foreign key constraint" error
**Solution**: Run `007_fix_foreign_key.sql` to remove problematic constraint

---

## Debug Logging

All actions include `console.log("[v0] ...")` statements. Check browser console for:
- Upload progress
- Database queries
- Error messages
- Success confirmations
