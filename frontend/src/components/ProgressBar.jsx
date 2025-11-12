function ProgressBar({ completedUnits, totalUnits }) {
    const percent = Math.min((completedUnits / totalUnits) * 100, 100);
  
    return (
        <div className="progress-bar-container">
            <div
                className="progress-bar-fill"
                style={{ width: `${percent}%` }}
            />
        </div>
    );
  }
  
  export default ProgressBar;  