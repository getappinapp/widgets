const { useState, useEffect } = React;

export const width = 230;
export const height = 50;
export const x = 10;
export const y = 895;
const DECIMAL_PLACES = 9;
const TICK_MS = 100;
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;

const BIRTHDAY = "12/4/2005";

const parseBirthday = (str) => {
  const [day, month, year] = str.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const AgeCalculator = () => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const birthDate = parseBirthday(BIRTHDAY);
  const ageMs = now - birthDate.getTime();
  const ageYears = Math.max(0, ageMs / MS_PER_YEAR);
  const [intPart, decPart = ""] = ageYears.toFixed(DECIMAL_PLACES).split(".");

  return (
    <div className="age-counter" style={{ height: height, width: width }}>
      <span className="int number">{intPart}</span>
      <span className="dot number">.</span>
      <span className="dec number">{decPart}</span>
    </div>
  );
};

export default AgeCalculator;

export const className = `

.age-counter {
    font-family: "JetBrains Mono", "SF Mono", "Menlo", "Consolas", monospace;
    -webkit-font-smoothing: antialiased;
    background: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
  }

  .number {
    font-size: 28px;
    padding-top: 2px;
  }

  .int { color: #ffffff; }
  .dot { color: #ffffff; }
  .dec { color: #6b6b6b; }
`;
