import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsView } from "@/components/SettingsView";
import { Nav } from "@/components/Nav";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SettingsView user={user} />
      <Nav />
    </div>
  );
}


