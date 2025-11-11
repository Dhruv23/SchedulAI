function ProgressBar({ completedUnits, totalUnits }) {
    const percent = Math.min((completedUnits / totalUnits) * 100, 100);
  
    return (
      <div style={{ margin: "2rem 0" }}>
        <div style={{ marginBottom: ".5rem" }}>
          Progress toward degree: {completedUnits}/{totalUnits} units
        </div>
        <div style={{ height: "24px", background: "#eee", borderRadius: "12px" }}>
          <div
            style={{
              width: `${percent}%`,
              background: "#4CAF50",
              height: "100%",
              borderRadius: "12px",
              transition: "width 0.4s ease-in-out",
            }}
          />
        </div>
      </div>
    );
  }
  
  export default ProgressBar;  