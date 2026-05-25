/**
 * UserLayout — wraps with HomeLayout (navbar + main layout)
 * Note: UnifiedLayout was referenced here but does not exist in the codebase.
 */
import HomeLayout from "./HomeLayout";

export default function UserLayout({ children }) {
  return <HomeLayout>{children}</HomeLayout>;
}
