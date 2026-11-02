import { Suspense } from "react";
import VerifyAyahPage from "../../../features/corpus/verify-ayah-page";

export const metadata = {
  title: "Verify an ayah proof",
};

export default function VerifyAyahRoute() {
  return (
    <Suspense fallback={null}>
      <VerifyAyahPage />
    </Suspense>
  );
}
