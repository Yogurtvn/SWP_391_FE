import { RouterProvider } from "react-router";
import { router } from "@/routes";
import { AppProviders } from "@/store/providers/AppProviders";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AppProviders>
  );
}
