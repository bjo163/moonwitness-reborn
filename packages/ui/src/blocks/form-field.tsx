import { cn } from "../lib/utils.js";
import { RawField, type RawFieldProps } from "../raw/field.js";

export type FormFieldProps = RawFieldProps;

export function FormField({ className, ...props }: FormFieldProps) {
  return <RawField className={cn("ql-field", className)} {...props} />;
}
