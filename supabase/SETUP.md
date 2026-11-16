# הקמת Supabase – צעדים ידניים

1. **פרויקט:** ב-[supabase.com](https://supabase.com) צרו פרויקט חדש (תוכנית Free מספיקה).
2. **טבלאות:** Supabase ← *SQL Editor* ← *New query* ← הדביקו את כל התוכן של `supabase/schema.sql` ← *Run*.
   הקובץ בטוח להרצה חוזרת, ומכניס את הקטלוג ההתחלתי (9 דגמים, 7 צבעים, 2 מילויים) רק אם הטבלאות ריקות.
3. **משתמש מנהל:** *Authentication* ← *Users* ← *Add user* (אימייל + סיסמה, לסמן *Auto Confirm User*).
4. **לחסום הרשמה חופשית:** *Authentication* ← *Sign In / Providers* ← לכבות *Allow new users to sign up*.
5. **להפוך אותו למנהל** (ב-SQL Editor, עם האימייל שלכם):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'YOUR-ADMIN-EMAIL@example.com'
   on conflict do nothing;
   ```
6. **משתני סביבה** (*Project Settings* ← *API*): `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - מקומית: צרו `.env.local` לפי `.env.example`.
   - ב-Vercel: *Settings* ← *Environment Variables* (לכל הסביבות), ואז Redeploy – הערכים נקבעים בזמן build.
7. **בדיקה:** `/admin/login` ← כניסה ← *הזמנות / קטלוג / הגדרות*. בדף הלקוח (`/`) מבצעים הזמנת בדיקה ורואים אותה ב-`/admin`.

> שימו לב: אל תשתמשו ב-`service_role` key באתר. האתר עובד רק עם ה-publishable key (שם המפתח הציבורי ב-Supabase, בעבר anon), וההרשאות נאכפות במסד הנתונים (RLS).
