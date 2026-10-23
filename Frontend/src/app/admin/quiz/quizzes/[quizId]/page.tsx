import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";

export default function QuizDetailRedirectPage({
  params,
}: {
  params: { quizId: string };
}) {
  redirect(ROUTES.ADMIN_QUIZ_QUESTIONS(params.quizId));
}
