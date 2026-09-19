import { Link } from "react-router-dom";
import { CircleHelp } from "lucide-react";

export default function HelpLink({ to, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-11 items-center gap-2 self-start rounded-xl px-1 text-base font-bold text-primary underline-offset-4 hover:underline ${className}`}
    >
      <CircleHelp className="size-5" />
      Lihat panduan
    </Link>
  );
}
