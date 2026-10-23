"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function UserImportPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.ADMIN_USER_STUDENT);
  }, [router]);

  return null;
}
