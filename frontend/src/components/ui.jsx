const buttonVariants = {
  primary: "mq-button--primary",
  secondary: "mq-button--secondary",
  danger: "mq-button--danger",
};

const buttonSizes = {
  sm: "mq-button--sm",
  md: "mq-button--md",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <button
      className={`mq-button ${buttonVariants[variant] || buttonVariants.primary} ${buttonSizes[size] || buttonSizes.md} ${className}`.trim()}
      {...props}
    />
  );
}

export function Card({ as: Component = "section", className = "", ...props }) {
  return <Component className={`mq-card ${className}`.trim()} {...props} />;
}

export function TextInput({ id, label, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className="mq-input" {...props} />
    </div>
  );
}

export function StatusBadge({ status = "neutral", children, className = "" }) {
  const normalized = String(status).toLowerCase();
  const variant = ["success", "normal"].includes(normalized)
    ? "success"
    : ["warning", "mild", "low", "high"].includes(normalized)
      ? "warning"
      : ["danger", "critical", "error"].includes(normalized)
        ? "danger"
        : "neutral";

  return (
    <span className={`mq-badge mq-badge--${variant} ${className}`.trim()}>
      {children ?? status}
    </span>
  );
}

export function LoadingState({ children = "Loading...", className = "" }) {
  return (
    <div className={`mq-state ${className}`.trim()} role="status" aria-live="polite">
      <p className="mq-state__message">{children}</p>
    </div>
  );
}

export function EmptyState({ title, children, className = "" }) {
  return (
    <section className={`mq-state ${className}`.trim()}>
      {title && <h2 className="mq-state__title">{title}</h2>}
      {children && <p className="mq-state__message">{children}</p>}
    </section>
  );
}

export function PageHeader({ title, description, actions, className = "" }) {
  return (
    <header className={`mq-page-header ${className}`.trim()}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </header>
  );
}
