import { WishlistEditor } from "@/components/admin/wishlist-editor";
import { env } from "@/lib/env";
import { suggestPassphrase } from "@/lib/passwords";
import { DEFAULT_THEME } from "@/lib/theme/presets";

export default function NewWishlistPage() {
  return (
    <WishlistEditor
      hasAi={env.hasAnthropicKey}
      initial={{ title: "", description: "", password: suggestPassphrase(), theme: DEFAULT_THEME }}
    />
  );
}
