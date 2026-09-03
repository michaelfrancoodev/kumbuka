import { redirect } from "next/navigation";

/** The root path always opens straight into the app. */
export default function RootPage() {
  redirect("/app");
}
