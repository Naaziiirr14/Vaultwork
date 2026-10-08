import { motion } from "framer-motion";

export default function PageWrap({ children, className = "" }) {
  return (
    <motion.main
      className={`page ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.main>
  );
}