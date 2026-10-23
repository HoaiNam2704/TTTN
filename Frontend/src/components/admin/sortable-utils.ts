import {
  defaultAnimateLayoutChanges,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";

/** Smooth easing used while sibling rows shift during drag. */
export const SORTABLE_TRANSITION = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
} as const;

export const SORTABLE_DROP_ANIMATION = {
  duration: 220,
  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
} as const;

/** Keep layout animations on while sorting so rows ease into place. */
export const animateSortableLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });
