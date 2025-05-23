

# Supabase User Management Guide

## Viewing and Managing User Profiles

### 1. Accessing User Management
To manage users in your Supabase project:
1. Log in to your Supabase dashboard at [https://app.supabase.io/](https://app.supabase.io/)
2. Select your project
3. Navigate to "Authentication" in the left sidebar
4. Click "Users" to see all users in your project

### 2. Making a User an Admin
To set a user as an admin:

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following SQL (replace the UUID with the user's ID):

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_admin}',
  'true'
)
WHERE id = '00000000-0000-0000-0000-000000000000';
```

3. After running the query, you'll need to sign out and sign back in for the changes to take effect.

4. Alternatively, you can also run this SQL which updates both the `raw_user_meta_data` and `raw_app_meta_data` fields:

```sql
UPDATE auth.users
SET 
  raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{is_admin}', 'true'),
  raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{is_admin}', 'true')
WHERE id = '00000000-0000-0000-0000-000000000000';
```

### 3. Editing User Metadata
Supabase doesn't provide direct UI for editing user metadata, but you can use these methods:

#### Method A: Using SQL Editor
1. Go to the "SQL Editor" in your Supabase dashboard
2. Run the following SQL (replace values accordingly):
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{first_name}',
  '"New First Name"'
)
WHERE id = '00000000-0000-0000-0000-000000000000';
```

#### Method B: Using Admin API
You can use the Supabase admin API to update user metadata:

```javascript
const { data, error } = await supabase.auth.admin.updateUserById(
  'user-uuid',
  { user_metadata: { first_name: 'New First Name', phone: '+1234567890' } }
)
```
⚠️ Note: This requires the service role key and should ONLY be used in secure, server-side contexts.

### 3. Debugging Profile Data Issues

If you experience issues with user profile data not being saved properly:

1. **Check the user metadata**: Verify that user metadata is correctly set during signup by checking the auth.users table:

```sql
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'user@example.com';
```

2. **Check profile data**: Verify that the profile exists in the profiles table:

```sql
SELECT * FROM public.profiles 
WHERE id = 'user-uuid';
```

3. **Check trigger function**: If using a trigger to create profiles from auth.users, verify it's working:

```sql
-- Example function to check
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Manually Creating Profiles

If profiles aren't being created automatically, you can add them manually:

```sql
INSERT INTO public.profiles (id, first_name, last_name, phone)
VALUES ('user-uuid', 'First Name', 'Last Name', 'Phone Number');
```

### 5. Viewing Authentication Logs

To debug authentication issues:
1. Go to "Authentication" → "Logs" in your Supabase dashboard
2. Look for any errors related to the user signup or login process

### 6. Important Settings to Check

1. **Email Confirmation**: If you want users to sign in immediately without email verification:
   - Go to "Authentication" → "Providers" → "Email"
   - Disable "Confirm email" setting

2. **JWT Expiry**: If you want to adjust how long users stay logged in:
   - Go to "Authentication" → "JWT Configuration" 
   - Adjust the JWT expiry time

For additional support, refer to the [Supabase User Management documentation](https://supabase.com/docs/guides/auth/managing-user-data).

