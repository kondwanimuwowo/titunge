import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyBusinesses } from "@/lib/business-context";
import SignOutButton from "@/components/auth/SignOutButton";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "titunge.com";

function workspaceUrl(slug: string): string {
  return process.env.NODE_ENV === "development"
    ? `/api/dev/use-workspace?slug=${slug}`
    : `https://${slug}.${APP_DOMAIN}/dashboard`;
}

export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = (await headers()).get("x-business-slug");
  const myBusinesses = (await getMyBusinesses(user.id)).filter((b) => b.slug !== slug);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldAlert className="text-destructive" size={22} />
      </div>
      <h1 className="text-xl font-bold text-foreground">You don&apos;t have access to this workspace</h1>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
        You&apos;re signed in as <span className="font-medium text-foreground">{user.email}</span>, which isn&apos;t a
        member of {slug ? <span className="font-medium text-foreground">{slug}.{APP_DOMAIN}</span> : "this workspace"}.
        Sign in with the account that belongs to this business, or ask its admin to invite you.
      </p>

      <div className="mt-6">
        <SignOutButton />
      </div>

      {myBusinesses.length > 0 && (
        <div className="mt-6 text-sm text-muted-foreground">
          <p>Your workspaces:</p>
          <ul className="mt-2 space-y-1">
            {myBusinesses.map((b) => (
              <li key={b.id}>
                <a href={workspaceUrl(b.slug)} className="text-primary hover:underline">
                  {b.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
