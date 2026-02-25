import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export default function Image({ priority: _priority, ...props }: ImageProps) {
  return <img {...props} />;
}
