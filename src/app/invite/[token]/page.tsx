import Image from "next/image";
import { getInviteByToken } from "@/app/actions/invites";
import { createClient } from "@/lib/supabase/server";
import InviteAcceptForm from "@/components/invites/InviteAcceptForm";

const ERROR_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: "Invite not found",
    body: "This invite link doesn't exist. Ask the business owner to send you a new one.",
  },
  used: {
    title: "Invite already used",
    body: "This invite has already been accepted or was revoked.",
  },
  expired: {
    title: "Invite expired",
    body: "This invite link has expired. Ask the business owner to send you a new one.",
  },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getInviteByToken(token);

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center mb-6">
            <Image
              src="/titunge-logo.png"
              alt="Titunge"
              width={160}
              height={54}
              className="object-contain mb-3"
            />
          </div>

          {!result.valid ? (
            <div className="text-center space-y-2">
              <p className="text-base font-semibold text-foreground">
                {ERROR_COPY[result.reason].title}
              </p>
              <p className="text-sm text-muted-foreground">{ERROR_COPY[result.reason].body}</p>
            </div>
          ) : (
            <InviteAcceptForm
              token={token}
              invite={{
                email: result.invite.email,
                role: result.invite.role,
                businessName:
                  (result.invite.businesses as unknown as { name: string } | null)?.name ??
                  "this workspace",
              }}
              currentUserEmail={currentUser?.email ?? null}
            />
          )}
        </div>
      </div>
    </div>
  );
}
