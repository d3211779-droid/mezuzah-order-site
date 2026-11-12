import Header from "@/components/Header";
import OrderBuilder from "@/components/OrderBuilder";

export default function Home() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F2E8] text-[#3C3028]"
    >
      <div className="mx-auto max-w-5xl">
        <Header />
        <OrderBuilder />
      </div>
    </main>
  );
}
