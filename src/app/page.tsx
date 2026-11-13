import Header from "@/components/Header";
import OrderBuilder from "@/components/OrderBuilder";

export default function Home() {
  return (
    <main className="min-h-screen bg-cream text-brown">
      <div className="mx-auto max-w-6xl">
        <Header />
        <OrderBuilder />
      </div>
    </main>
  );
}
