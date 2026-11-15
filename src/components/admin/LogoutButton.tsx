import { signOut } from "@/app/admin/actions";

export default function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="min-h-11 rounded-full border border-line bg-white px-5 text-sm font-semibold transition hover:border-gold"
      >
        יציאה
      </button>
    </form>
  );
}
