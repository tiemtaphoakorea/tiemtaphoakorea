import { GENERATED_ICONS } from "@workspace/shared/generated-icons";
import Image from "next/image";

export { GENERATED_ICONS };

type GeneratedIconProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function GeneratedIcon({ src, alt = "", className }: GeneratedIconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={96}
      height={96}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
    />
  );
}
