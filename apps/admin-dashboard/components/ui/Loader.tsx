import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export default function Loader({ className = "" }: { className?: string }) {
  return (
    <LoaderCircle className={cn(className, "animate-spin")} />
  )
}
