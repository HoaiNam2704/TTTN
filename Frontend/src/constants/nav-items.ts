import { ROUTES } from "./routes";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: ROUTES.ADMIN, icon: "home" },
      { label: "Courses", href: ROUTES.ADMIN_COURSES, icon: "book" },
      { label: "Categories", href: ROUTES.ADMIN_CATEGORIES, icon: "grid" },
      { label: "Students", href: ROUTES.ADMIN_USER_STUDENT, icon: "users" },
    ],
  },
  {
    title: "Practice",
    items: [
      { label: "Topics", href: ROUTES.ADMIN_QUIZ_TOPICS, icon: "grid" },
      { label: "Quizzes", href: ROUTES.ADMIN_QUIZ_QUIZZES, icon: "book" },
    ],
  },
];

export const ADMIN_BOTTOM_NAV: NavItem[] = [
  { label: "Logout", href: ROUTES.LOGIN, icon: "logout" },
];
