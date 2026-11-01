import type { ReactNode } from "react";

export interface RawFieldProps {
  label: string;
  htmlFor: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function RawField({
  label,
  htmlFor,
  description,
  children,
  className,
}: RawFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {description && <div>{description}</div>}
    </div>
  );
}
