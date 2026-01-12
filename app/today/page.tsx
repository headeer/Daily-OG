import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TodayView } from "@/components/TodayView";
import { Nav } from "@/components/Nav";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <TodayView userId={user.id} />
      <Nav />
    </div>
  );
}

