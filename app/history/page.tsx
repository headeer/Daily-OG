import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistoryView } from "@/components/HistoryView";
import { Nav } from "@/components/Nav";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <HistoryView userId={user.id} />
      <Nav />
    </div>
  );
}


