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
7. **בדיקה:** `/admin/login` ← כניסה ← *ראשי / הזמנות / דגמים / צבעים / מילויים / הגדרות*. בדף הלקוח (`/`) מבצעים הזמנת בדיקה ורואים אותה ב-`/admin`.

> שימו לב: אל תשתמשו ב-`service_role` key באתר. האתר עובד רק עם ה-publishable key (שם המפתח הציבורי ב-Supabase, בעבר anon), וההרשאות נאכפות במסד הנתונים (RLS).

## הגדרות האתר (שלב נוסף, אופציונלי)

כדי לערוך מגבלת תווים, הודעת אישור והערות מוצר מתוך `/admin/settings`: הריצו פעם אחת את הקובץ `supabase/settings.sql` ב-*SQL Editor* (אחרי `schema.sql`). אפשר להריץ אותו שוב בלי נזק; ערכים שכבר נערכו לא נדרסים. עד שמריצים אותו האתר ללקוחות עובד עם הערכים הרגילים.

## מחירים וסל קניות (שלבים נוספים)

1. `supabase/prices.sql` – מוסיף מחיר לדגמים (באגורות). מזינים מחירים ב-`/admin/models`.
2. `supabase/cart-orders.sql` – הזמנות עם כמה פריטים (`order_items`), סכום הזמנה, מניעת הזמנות כפולות והפונקציה `create_cart_order`. מריצים **לפני** פריסת האתר החדש. ההזמנות הקיימות נשמרות (כל אחת הופכת להזמנה עם פריט אחד, בלי מחיר). אפשר להריץ שוב בלי נזק.
3. `supabase/parchments.sql` – קלף כתוספת בתשלום למזוזה: טבלת `parchments`, snapshot של הקלף ב-`order_items`, ועדכון `create_cart_order`. מריצים **אחרי** `cart-orders.sql`, ואפשר **לפני** או אחרי הפריסה (עד שמריצים אותו הלקוחות פשוט לא רואים את אפשרות הקלף). אחרי ההרצה: `/admin/parchments` ← מזינים מחיר לקלף ומפעילים אותו. אפשר להריץ שוב בלי נזק. אם מריצים שוב את `cart-orders.sql`, מריצים אחריו שוב את `parchments.sql`.
