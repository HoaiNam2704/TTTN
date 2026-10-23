import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function QuizAdminPage() {
  redirect(ROUTES.ADMIN_QUIZ_TOPICS);
}
