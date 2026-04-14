import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <Image
      src="https://bitora.it/bitora.png"
      alt="Bitora"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      unoptimized
    />
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold ${className}`}>
      <span className="text-white">blog </span>
      <span className="text-blue-400">Bitora</span>
    </span>
  );
}
