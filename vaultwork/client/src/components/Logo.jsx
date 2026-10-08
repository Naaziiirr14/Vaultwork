import { Link } from "react-router-dom";
import Guilloche from "./Guilloche.jsx";

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Vaultwork home">
      <Guilloche size={30} petals={9} weight={9} />
      <span>Vaultwork</span>
    </Link>
  );
}
