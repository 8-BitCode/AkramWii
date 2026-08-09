import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * AutoFitScale
 *
 * Measures the natural (unscaled) size of its children and the width
 * available from its parent, then applies a CSS transform: scale(...) so
 * the content always fits the available width — on any screen size, not
 * just at a couple of hardcoded breakpoints.
 *
 * This is meant for content with a fixed intrinsic pixel size (like an
 * embedded game canvas) that can't reflow on its own. Text/flex layouts
 * should keep reflowing normally via CSS — only wrap the parts that need
 * literal shrink-to-fit scaling.
 *
 * - Never scales content up past `maxScale` (default 1), so pixel art
 *   stays crisp instead of getting blurry on large screens.
 * - `boost` (default 1) multiplies the fit-to-width scale so callers can
 *   ask for the content to render slightly larger than an exact fit (e.g.
 *   on mobile, where a little intentional bleed into the side padding
 *   reads as "bigger" without needing a separate breakpoint). Pair with a
 *   `maxScale` above 1 when using a boost, since maxScale is the hard
 *   ceiling regardless of boost.
 * - Re-measures via ResizeObserver on both the container and the content,
 *   so it stays correct through window resizes, sidebar toggles, and the
 *   game finishing its own load (which can change its natural size).
 */
const AutoFitScale = ({ children, maxScale = 1, boost = 1 }) => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      const naturalWidth = inner.offsetWidth;
      const naturalHeight = inner.offsetHeight;
      const availableWidth = outer.offsetWidth;

      if (!naturalWidth || !naturalHeight || !availableWidth) return;

      const nextScale = Math.min(maxScale, (availableWidth / naturalWidth) * boost);

      setScale((prev) => (Math.abs(prev - nextScale) > 0.001 ? nextScale : prev));
      setNaturalSize((prev) =>
        prev.width !== naturalWidth || prev.height !== naturalHeight
          ? { width: naturalWidth, height: naturalHeight }
          : prev
      );
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);

    window.addEventListener("resize", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [maxScale, boost]);

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", display: "flex", justifyContent: "center" }}
    >
      {/* Spacer: collapses layout space to match the visually scaled size,
          since `transform` alone doesn't affect the box's footprint. */}
      <div
        style={{
          width: naturalSize.width ? naturalSize.width * scale : undefined,
          height: naturalSize.height ? naturalSize.height * scale : undefined,
          transition: "width 250ms ease, height 250ms ease",
        }}
      >
        <div
          ref={innerRef}
          style={{
            display: "inline-block",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            transition: "transform 250ms ease",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AutoFitScale;