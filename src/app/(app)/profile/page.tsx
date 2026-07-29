import { redirect } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import ProfileForm from "@/components/profile/ProfileForm";
import { Badge } from "@/components/ui/badge";
import { ROLE_BADGE_COLORS } from "@/lib/constants";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await (supabase.from("user_profiles") as any)
    .select("*")
    .eq("id", user.id)
    .single();

  const initials = profile?.full_name
    ? String(profile.full_name)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="My Profile"
        description="Manage your account information"
      />

      {/* Profile Card */}
      <div className="bg-card border rounded-lg p-6 max-w-lg">
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground tracking-tight">
              {profile?.full_name || "—"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {profile?.email || user.email || "—"}
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              {/* @ts-ignore */}
              <Badge
                variant="outline"
                className={
                  ROLE_BADGE_COLORS[profile?.role] ||
                  "bg-muted text-muted-foreground border-border"
                }
              >
                {profile?.role
                  ? String(profile.role).charAt(0).toUpperCase() +
                    String(profile.role).slice(1)
                  : "—"}
              </Badge>
              {profile?.created_at && (
                <span className="text-xs text-muted-foreground">
                  Member since {format(new Date(profile.created_at), "MMM yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProfileForm profile={profile || null} />
    </div>
  );
}
