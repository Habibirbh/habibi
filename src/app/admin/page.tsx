import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/sections/Footer";
import { AdminPanel } from "@/components/web3/AdminPanel";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <AdminPanel />
      </main>
      <Footer />
    </>
  );
}
