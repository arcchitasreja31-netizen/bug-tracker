
function StatCard({ title, value, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <h3>{title}</h3>
        <span>{icon}</span>
      </div>

      <h1 style={{ color: color }}>
        {value}
      </h1>
    </div>
  );
}

export default StatCard;
