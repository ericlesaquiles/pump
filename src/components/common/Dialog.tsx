import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "../../hooks/useI18n.ts";
import { Button } from "./Button.tsx";
import styles from "./Dialog.module.css";

interface Props {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  closeLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
}

/** A modal built on <dialog>. Render it to open it; unmount it to close. */
export function Dialog({ title, eyebrow, onClose, closeLabel, footer, children }: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (dlg && !dlg.open) dlg.showModal();
    return () => dlg?.close();
  }, []);

  return (
    <dialog ref={ref} className={styles.dialog} onCancel={(e) => { e.preventDefault(); onClose(); }} aria-label={title}>
      <div className={styles.body}>
        <div className={styles.head}>
          <div>
            {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <Button variant="ghost" small onClick={onClose}>{closeLabel ?? t.close}</Button>
        </div>
        {children}
        {footer && <div className={styles.foot}>{footer}</div>}
      </div>
    </dialog>
  );
}
