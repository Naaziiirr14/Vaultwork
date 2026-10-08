import { STATUS_LABEL } from "../utils/format.js";

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      <i />
      {STATUS_LABEL[status] || status}
    </span>
  );
}
