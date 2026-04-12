import { Link } from "react-router-dom";

const defaultLinkClass =
  "text-white/70 hover:text-white transition-colors no-underline";

type PageFooterProps = {
  className?: string;
  linkClassName?: string;
};

/**
 * Site footer links for inner pages (not shown on Home).
 */
export default function PageFooter({
  className = "",
  linkClassName = defaultLinkClass,
}: PageFooterProps) {
  return (
    <footer
      className={[
        "mt-auto shrink-0 pt-4 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Link to="/" className={linkClassName}>
        Home
      </Link>
      <Link to="/why" className={linkClassName}>
        Why Constellation
      </Link>
      <Link to="/security" className={linkClassName}>
        Privacy & Security
      </Link>
    </footer>
  );
}
