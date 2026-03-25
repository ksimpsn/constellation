import { useGoBack } from "../hooks/useGoBack";

type PageBackButtonProps = {
  className?: string;
};

/** Uses browser history when possible; see useGoBack. */
export default function PageBackButton({ className = "" }: PageBackButtonProps) {
  const goBack = useGoBack();
  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium px-4 py-2.5 rounded-lg border border-white/40 hover:border-white/60 transition-colors bg-transparent cursor-pointer font-inherit ${className}`.trim()}
    >
      ← Back
    </button>
  );
}
