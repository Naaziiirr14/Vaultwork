import Guilloche from "./Guilloche.jsx";

export default function Loader({ label = "Opening the vault" }) {
  return (
    <div className="loader" role="status">
      <Guilloche size={72} petals={14} weight={3} className="loader-rosette" />
      <p>{label}</p>
    </div>
  );
}
