import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "./Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      <Sidebar userEmail={session.user.email ?? ""} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
