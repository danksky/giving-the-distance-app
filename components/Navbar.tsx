import { auth, signOut, signIn } from "@/auth";
import { isAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import Image from "next/image";
import NavbarFrame from "@/components/NavbarFrame";

export default async function Navbar({
  sticky = true,
}: {
  sticky?: boolean;
}) {
  const session = await auth();
  const userIsAdmin = session?.user?.email
    ? isAdmin(session.user.email)
    : false;

  return (
    <NavbarFrame sticky={sticky}>
      <div className="flex-1">
        <Link
          href={session?.user ? "/dashboard" : "/"}
          className="btn btn-ghost px-2 navbar-brand"
        >
          <Image
            src="/logos/giving-the-distance-full.png"
            alt="Giving the Distance Logo"
            width={220}
            height={48}
            className="navbar-logo h-10 w-auto"
            priority
          />
        </Link>
      </div>
      {session?.user ? (
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-ghost btn-circle avatar navbar-action"
            >
              {session.user.image ? (
                <div className="navbar-avatar-frame w-10 rounded-full">
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="avatar placeholder">
                  <div className="navbar-avatar-frame bg-neutral text-neutral-content w-10 rounded-full">
                    <span className="text-lg">
                      {session.user.name?.charAt(0) || "U"}
                    </span>
                  </div>
                </div>
              )}
            </button>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title">{session.user.email}</li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              {userIsAdmin && (
                <li>
                  <Link href="/admin">Admin Dashboard</Link>
                </li>
              )}
              <li>
                <Link href="/settings">Settings</Link>
              </li>
              <li>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="w-full text-left">
                    Sign Out
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-none">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button type="submit" className="btn btn-primary navbar-action">
              Sign Up
            </button>
          </form>
        </div>
      )}
    </NavbarFrame>
  );
}
