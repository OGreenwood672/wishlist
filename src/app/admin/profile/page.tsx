import { ProfileEditor } from "@/components/admin/profile-editor";
import { getProfile } from "@/lib/data";

export default async function ProfilePage() {
  return <ProfileEditor initial={await getProfile()} />;
}
