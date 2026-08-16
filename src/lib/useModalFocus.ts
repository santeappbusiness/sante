"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keyboard behaviour a dialog owes the person using it.
 *
 * Three things, none of which browsers do on their own:
 *
 * Focus moves into the dialog when it opens, so the next Tab is inside it
 * rather than somewhere back up the page.
 *
 * Tab and Shift+Tab cycle within it. Without this, tabbing walks straight out
 * of an open sheet and into the page behind, which is invisible to a sighted
 * mouse user and completely disorienting to anyone relying on the keyboard.
 *
 * Focus returns to whatever opened it. Landing back at the top of the document
 * after closing a sheet means finding your place again from scratch, and this
 * is an app for people who are having a hard day.
 *
 * Escape and the scroll lock stay with the component, because what those should
 * do differs between a check-in you are part way through and a welcome note.
 */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalFocus(open: boolean, panel: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return;

    const returnTo = document.activeElement as HTMLElement | null;

    /* After paint, so the dialog's children exist to be focused. */
    const id = window.requestAnimationFrame(() => {
      const node = panel.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const node = panel.current;
      if (!node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      /* Wrap at both ends, and catch the case where focus has somehow escaped
         the dialog already. */
      if (!node.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
      /* Only if it is still on the page. A dialog that closed because the view
         changed has nothing sensible to hand focus back to. */
      if (returnTo && document.contains(returnTo)) returnTo.focus();
    };
  }, [open, panel]);
}
