import { useId, type ComponentProps } from "react";

export type InputProps = ComponentProps<"input"> & {
  /** Texto do rótulo acima do campo. */
  label?: string;
  /** Dica abaixo do campo. Some quando há erro. */
  hint?: string;
  /** Mensagem de erro. Quando existe, o campo fica marcado como inválido. */
  error?: string;
};

/** Campo de texto com rótulo, dica e erro opcionais. */
export function Input({ label, hint, error, id, className = "", ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={
          "h-10 rounded-sm border bg-background px-3 text-base text-foreground " +
          "placeholder:text-muted-foreground " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          (error ? "border-2 border-foreground " : "border-input ") +
          className
        }
        {...props}
      />
      {message && (
        <p
          id={messageId}
          className={`text-sm ${error ? "font-medium text-foreground" : "text-muted-foreground"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
