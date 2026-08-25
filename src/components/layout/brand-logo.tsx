import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  href?: string;
  priority?: boolean;
};

export function BrandLogo({
  className = "h-8 w-auto",
  href = "/",
  priority = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Dilanix home"
      className="inline-flex items-center"
    >
      <Image
        src="/dilanix-logo.png"
        alt="Dilanix"
        width={2172}
        height={724}
        priority={priority}
        className={className}
      />
    </Link>
  );
}
