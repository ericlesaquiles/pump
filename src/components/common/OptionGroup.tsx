import { useId } from "react";
import styles from "./OptionGroup.module.css";

interface Option<T extends string | number> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SingleProps<T extends string | number> {
  multiple?: false;
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

interface MultiProps<T extends string | number> {
  multiple: true;
  label: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  /** Disable unchecked options once this many are selected. */
  max?: number;
}

/** A row of pill-shaped radio buttons or checkboxes. */
export function OptionGroup<T extends string | number>(props: SingleProps<T> | MultiProps<T>) {
  const name = useId();
  const selected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const atMax = props.multiple && props.max !== undefined && props.value.length >= props.max;

  const toggle = (v: T) => {
    if (props.multiple) props.onChange(selected(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(v);
  };

  return (
    <div className={styles.options} role="group" aria-label={props.label}>
      {props.options.map((o) => (
        <label key={String(o.value)} className={styles.opt}>
          <input
            type={props.multiple ? "checkbox" : "radio"}
            name={name}
            value={String(o.value)}
            checked={selected(o.value)}
            disabled={o.disabled || (atMax && !selected(o.value))}
            onChange={() => toggle(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
