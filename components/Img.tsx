import { cf, cfSrcSet } from "@/lib/communities";

/**
 * Cloudflare-transformed <img>. Two modes:
 *  - default: intrinsic, responsive via srcset at the given `widths`
 *  - fill:    absolutely fills its (positioned) parent, object-cover
 * No Vercel Image Optimization — resizing happens on images.livemodern.com.
 */
type Props = {
  src: string;
  alt: string;
  widths?: number[];
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  quality?: number;
};

const DEFAULT_WIDTHS = [390, 640, 960, 1200, 1600];

export default function Img({
  src,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = "100vw",
  width,
  height,
  className,
  priority,
  fill,
  quality = 78,
}: Props) {
  if (!src) return null;
  const largest = Math.max(...widths);
  const common = {
    src: cf(src, fill ? 1600 : largest, quality),
    srcSet: cfSrcSet(src, widths, quality),
    sizes,
    alt,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    // eslint-disable-next-line @next/next/no-img-element
    ...(priority ? { fetchPriority: "high" as const } : {}),
  };
  if (fill) {
    return (
      <img
        {...common}
        className={className}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return <img {...common} className={className} width={width} height={height} style={{ width: "100%", height: "auto" }} />;
}
