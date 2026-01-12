import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CheckInView } from "@/components/CheckInView";
import { Nav } from "@/components/Nav";

export default async function CheckInPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CheckInView userId={user.id} />
      <Nav />
    </div>
  );
}

