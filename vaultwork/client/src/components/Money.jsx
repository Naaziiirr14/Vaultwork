import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { inr } from "../utils/format.js";

// Number count-up. Value maarumbodhu pazhaya value la irundhu smooth ah maarum.
export default function Money({ value, plain = false, className = "" }) {
  const prev = useRef(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const controls = animate(prev.current, Number(value) || 0, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => {
        prev.current = v;
        setShown(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{plain ? shown : inr(shown)}</span>;
}
