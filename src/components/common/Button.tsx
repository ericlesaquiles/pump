import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cx } from "../../lib/format.ts";
import styles from "./Button.module.css";

type Variant = "primary" | "ghost" | "danger" | "link";

interface Common {
  variant?: Variant;
  small?: boolean;
}

export function Button({ variant = "primary", small, className, type = "button", ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cx(styles.btn, styles[variant], small && styles.small, className)} {...rest} />;
}

/** An anchor styled like a button (for in-app navigation). */
export function LinkButton({ variant = "ghost", small, className, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={cx(styles.btn, styles[variant], small && styles.small, className)} {...rest} />;
}
