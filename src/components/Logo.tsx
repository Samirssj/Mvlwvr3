// src/components/Logo.tsx

const Logo = () => (
  <svg
    viewBox="0 0 400 150"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: "180px", height: "auto" }}  // puedes ajustar aquí
  >
    <defs>
      <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#0040ff", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#0030cc", stopOpacity: 1 }} />
      </linearGradient>

      <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#e0e0e0", stopOpacity: 1 }} />
      </linearGradient>

      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect width="400" height="150" fill="#000000" rx="10" />

    <circle cx="60" cy="75" r="35" fill="url(#playGradient)" filter="url(#glow)" />

    <path d="M 52 60 L 52 90 L 75 75 Z" fill="white" opacity="0.95" />

    <path
      d="M 95 60 Q 100 60 100 65 L 100 85 Q 100 90 95 90"
      stroke="#0040ff"
      strokeWidth="2"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M 105 55 Q 110 55 110 60 L 110 90 Q 110 95 105 95"
      stroke="#0040ff"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />

    <text
      x="130"
      y="85"
      fontFamily="'Arial Black', 'Arial Bold', sans-serif"
      fontSize="42"
      fontWeight="900"
      fill="url(#textGradient)"
      letterSpacing="2"
    >
      MVLWVR3
    </text>

    <text
      x="132"
      y="105"
      fontFamily="Arial, sans-serif"
      fontSize="11"
      fill="#888888"
      letterSpacing="3"
    >
      STREAMING SIN LÍMITES
    </text>

    <circle cx="320" cy="50" r="2" fill="#0040ff" opacity="0.7" />
    <circle cx="330" cy="45" r="1.5" fill="#0040ff" opacity="0.5" />
    <circle cx="340" cy="52" r="2.5" fill="#0040ff" opacity="0.6" />
  </svg>
);

export default Logo;
