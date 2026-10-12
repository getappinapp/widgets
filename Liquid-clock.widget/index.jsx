import { useState, useEffect, useRef } from "appinapp-react";
import bg from "./bg.png";

const size = 170;
const center = height / 2;
const smooth = true;

const Clock = () => {
  const [, setTick] = useState(0);
  const rafRef = useRef();
  const secondRef = useRef();

  useEffect(() => {
    if (!smooth) {
      const id = setInterval(() => setTick((n) => n + 1), 1000);
      return () => clearInterval(id);
    }
    const loop = () => {
      const now = new Date();
      const ms = now.getMilliseconds();
      const seconds = now.getSeconds();
      const deg = (seconds + ms / 1000) * 6;
      if (secondRef.current) {
        secondRef.current.style.transform = `rotate(${deg}deg)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const now = new Date();
  const ms = now.getMilliseconds();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const minuteDeg = minutes * 6 + (seconds + ms / 1000) * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;
  const secondDeg = smooth ? (seconds + ms / 1000) * 6 : seconds * 6;

  const HandWithPill = ({ width = 7, height, deg, pillHeight }) => (
    <div
      style={{
        position: "absolute",
        left: center - width / 2,
        top: center - height,
        width,
        height,
        backgroundColor: "white",
        borderRadius: width,
        transformOrigin: "bottom center",
        transform: `rotate(${deg}deg)`,
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: width * 0.3,
          height: pillHeight,
          backgroundColor: "black",
          borderRadius: width * 0.25,
          marginTop: height * 0.05,
        }}
      />
    </div>
  );

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <img src={bg} height={size} width={size} draggable={false} />

      <HandWithPill height={40} deg={hourDeg} pillHeight={20} />
      <HandWithPill height={55} deg={minuteDeg} pillHeight={30} />

      <div
        ref={smooth ? secondRef : undefined}
        style={{
          position: "absolute",
          left: center - 1.5,
          top: center - 65,
          width: 3,
          height: 80,
          backgroundColor: "#FF4500",
          borderRadius: 2,
          transformOrigin: "center 65px",
          transform: `rotate(${secondDeg}deg)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: center - 5,
          top: center - 5,
          width: 10,
          height: 10,
          backgroundColor: "#FF4500",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: center - 3,
          top: center - 3,
          width: 6,
          height: 6,
          backgroundColor: "#0a0a0a",
          borderRadius: "50%",
        }}
      />
    </div>
  );
};

export default Clock;
