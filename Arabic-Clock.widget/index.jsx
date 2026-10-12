import { useState, useEffect } from "appinapp-react";
import arabic from "./arabic.ttf";
import Scritto from "appinapp-animations";

const pad = (n) => String(n).padStart(2, "0");

const ArabicClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const date = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <div id="arabicClock" style={{ height: 150, width: 380 }}>
      <div className="date">{date}</div>
      <Scritto value={time} className={"time"} />
    </div>
  );
};

export default ArabicClock;

export const className = `
@font-face {
  font-family: "Arabic";
  src: url(${arabic});
}
#arabicClock {
  display: flex;
  flex-direction: column;
  align-items: center;
  -webkit-user-select: none;
}
#arabicClock .date {
  font-size: 16px;
  font-weight: 300;
  color: #ffffff80;
}
#arabicClock .time {
  font-size: 135px;
  font-weight: 400;
  line-height: 0.8;
  margin-top: 30px;
  letter-spacing: .01em;
  color: #ffffffd1;
  font-family: Arabic, sans-serif;
}
`;
