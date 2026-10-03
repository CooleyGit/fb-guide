// Compact inline icons (currentColor). Run/pass/QB icons are reused across the
// formation tendencies and the play-variation control so the language is consistent.
type IconProps = { size?: number };

const svg = (size: number, children: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor">
    {children}
  </svg>
);

// Custom filled football icons (provided by the user). currentColor fill so
// they turn white on a selected (maroon) segment.
const filled = (size: number, d: string) => (
  <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden="true" fill="currentColor">
    <path d={d} />
  </svg>
);

const RUN_PATH =
  "M100 39.964C80.1117 39.9643 62.5002 47.5623 49.9582 55.0437L49.9658 144.952C62.4986 152.442 80.1099 160.04 100.007 160.03C119.905 160.021 137.507 152.432 150.049 144.951L150.033 55.0511C137.5 47.5612 119.889 39.9637 100 39.964ZM125.023 94.9921L135.027 95.0054C136.31 95.0677 137.52 95.6212 138.406 96.5513C139.292 97.4813 139.786 98.7165 139.786 100.001C139.786 101.285 139.292 102.521 138.406 103.451C137.52 104.381 136.31 104.934 135.027 104.997L125.022 105.01L125.02 110.015C125.02 111.342 124.493 112.614 123.555 113.552C122.617 114.49 121.344 115.017 120.018 115.017C118.691 115.017 117.419 114.49 116.48 113.552C115.542 112.614 115.015 111.342 115.015 110.015L115.015 105.013L105.002 105.004L105.002 110.006C105.002 111.333 104.475 112.605 103.536 113.544C102.598 114.482 101.326 115.009 99.9991 115.009C98.6724 115.009 97.4 114.482 96.4619 113.544C95.5238 112.606 94.9968 111.333 94.9968 110.006L94.9969 105.004L84.9899 105.006L84.9898 110.009C84.9898 110.666 84.8604 111.316 84.609 111.923C84.3576 112.53 83.9891 113.082 83.5246 113.546C83.0601 114.011 82.5086 114.379 81.9017 114.631C81.2948 114.882 80.6443 115.011 79.9873 115.011C79.3304 115.011 78.6799 114.882 78.073 114.631C77.4661 114.379 76.9146 114.011 76.4501 113.546C75.9856 113.082 75.6172 112.53 75.3658 111.923C75.1144 111.316 74.985 110.666 74.985 110.009L74.9761 105.011L64.9714 104.998C63.6884 104.936 62.4786 104.382 61.5927 103.452C60.7067 102.522 60.2126 101.287 60.2126 100.002C60.2126 98.7177 60.7068 97.4825 61.5928 96.5524C62.4787 95.6224 63.6886 95.0688 64.9715 95.0065L74.9763 94.9929L74.9786 89.9883C74.9786 88.6615 75.5057 87.3892 76.4438 86.451C77.382 85.5129 78.6543 84.9858 79.9811 84.9858C81.3078 84.9858 82.5801 85.5128 83.5183 86.4509C84.4564 87.389 84.9834 88.6614 84.9834 89.9881L84.9833 94.9905L94.997 94.9993L94.9971 89.9969C94.9971 89.34 95.1265 88.6895 95.3779 88.0826C95.6293 87.4757 95.9978 86.9242 96.4623 86.4597C96.9269 85.9951 97.4783 85.6267 98.0852 85.3753C98.6922 85.1239 99.3427 84.9945 99.9996 84.9945C100.656 84.9944 101.307 85.1238 101.914 85.3752C102.521 85.6266 103.072 85.9951 103.537 86.4596C104.001 86.9241 104.37 87.4755 104.621 88.0824C104.873 88.6894 105.002 89.3398 105.002 89.9968L105.002 94.9991L115.009 94.9968L115.009 89.9944C115.009 88.6677 115.536 87.3953 116.474 86.4571C117.412 85.519 118.685 84.9919 120.011 84.9919C121.338 84.9919 122.61 85.5189 123.549 86.457C124.487 87.3951 125.014 88.6675 125.014 89.9942L125.023 94.9921ZM162.067 136.801C175.927 126.218 189.917 110.745 189.906 99.998C189.895 89.2514 175.925 73.7805 162.068 63.1955C161.429 62.7091 160.75 62.2004 160.038 61.6805L160.036 138.33C160.749 137.796 161.428 137.288 162.067 136.801ZM37.9318 63.2019C24.072 73.7851 10.0821 89.2586 10.0931 100.005C10.0908 107.511 16.9263 117.336 25.779 126.189C29.5922 129.99 33.6515 133.536 37.9306 136.803C38.5694 137.29 39.2485 137.798 39.9612 138.318L39.9623 61.6688C39.2496 62.2067 38.5705 62.7155 37.9318 63.2019Z";

const PASS_PATH =
  "M57.5477 57.5473C43.4846 71.6108 36.4039 89.4366 32.8255 103.595L96.4058 167.165C110.564 163.599 128.389 156.518 142.452 142.442C156.515 128.366 163.596 110.553 167.174 96.3939L103.594 32.8371C89.436 36.4029 71.6107 43.4838 57.5477 57.5473ZM114.152 78.7646L121.236 71.6996C122.187 70.8364 123.434 70.3724 124.718 70.4035C126.002 70.4347 127.225 70.9587 128.133 71.867C129.041 72.7753 129.565 73.9982 129.596 75.2823C129.628 76.5664 129.164 77.8133 128.301 78.7646L121.236 85.8487L124.773 89.3891C125.711 90.3272 126.238 91.5996 126.238 92.9264C126.238 94.2531 125.711 95.5255 124.773 96.4636C123.835 97.4018 122.562 97.9288 121.236 97.9288C119.909 97.9288 118.637 97.4018 117.699 96.4636L114.161 92.9264L107.074 100.001L110.612 103.538C111.55 104.476 112.077 105.749 112.077 107.075C112.077 108.402 111.55 109.675 110.612 110.613C109.673 111.551 108.401 112.078 107.074 112.078C105.748 112.078 104.475 111.551 103.537 110.613L100 107.075L92.9257 114.153L96.4628 117.69C96.9273 118.155 97.2958 118.706 97.5472 119.313C97.7986 119.92 97.928 120.571 97.928 121.228C97.928 121.885 97.7986 122.535 97.5472 123.142C97.2958 123.749 96.9273 124.301 96.4628 124.765C95.9983 125.23 95.4469 125.598 94.84 125.849C94.2331 126.101 93.5826 126.23 92.9257 126.23C92.2688 126.23 91.6183 126.101 91.0114 125.849C90.4045 125.598 89.853 125.23 89.3885 124.765L85.8482 121.237L78.7643 128.302C77.8131 129.165 76.5662 129.629 75.2821 129.598C73.9981 129.567 72.7752 129.043 71.8669 128.135C70.9587 127.227 70.4347 126.004 70.4035 124.72C70.3723 123.435 70.8364 122.189 71.6995 121.237L78.7643 114.153L75.2272 110.613C74.289 109.675 73.762 108.402 73.762 107.075C73.762 105.749 74.289 104.476 75.2272 103.538C76.1653 102.6 77.4376 102.073 78.7643 102.073C80.091 102.073 81.3634 102.6 82.3015 103.538L85.8387 107.075L92.9257 100.001L89.3885 96.4636C88.924 95.9991 88.5555 95.4477 88.3041 94.8407C88.0527 94.2338 87.9234 93.5833 87.9234 92.9264C87.9234 92.2694 88.0527 91.6189 88.3041 91.012C88.5555 90.4051 88.924 89.8536 89.3885 89.3891C89.853 88.9246 90.4045 88.5561 91.0114 88.3047C91.6183 88.0533 92.2688 87.9239 92.9257 87.9239C93.5826 87.9239 94.2331 88.0533 94.84 88.3047C95.4469 88.5561 95.9983 88.9246 96.4628 89.3891L100 92.9264L107.074 85.8487L103.537 82.3114C102.599 81.3732 102.072 80.1008 102.072 78.7741C102.072 77.4474 102.599 76.175 103.537 75.2368C104.475 74.2987 105.748 73.7716 107.074 73.7716C108.401 73.7716 109.673 74.2987 110.612 75.2368L114.152 78.7646ZM169.91 82.1339C172.227 64.85 171.178 44.0163 163.571 36.4251C155.964 28.8339 135.147 27.7721 117.863 30.0859C117.068 30.1936 116.228 30.3141 115.356 30.4504L169.555 84.6505C169.682 83.7694 169.802 82.9295 169.91 82.1339ZM30.0902 117.868C27.7733 135.152 28.8224 155.986 36.4292 163.577C41.735 168.886 53.516 171 66.0356 171C71.4196 170.991 76.7972 170.628 82.1335 169.913C82.929 169.805 83.769 169.685 84.6406 169.548L30.4421 115.348C30.3184 116.232 30.198 117.072 30.0902 117.868Z";

// Football helmet (provided by the user) for the balanced / neutral case.
const HELMET_PATH =
  "M73.4375 128.125C73.4375 129.67 72.9793 131.181 72.1209 132.465C71.2624 133.75 70.0423 134.751 68.6147 135.343C67.1872 135.934 65.6163 136.089 64.1009 135.787C62.5854 135.486 61.1933 134.742 60.1007 133.649C59.0081 132.557 58.2641 131.165 57.9626 129.649C57.6612 128.134 57.8159 126.563 58.4072 125.135C58.9985 123.708 59.9999 122.487 61.2846 121.629C62.5694 120.771 64.0798 120.312 65.625 120.312C67.697 120.312 69.6842 121.135 71.1493 122.601C72.6144 124.066 73.4375 126.053 73.4375 128.125ZM179.688 137.5V162.5C179.688 165.401 178.535 168.183 176.484 170.234C174.433 172.285 171.651 173.437 168.75 173.437H140.625C138.271 173.427 135.982 172.663 134.094 171.257C132.205 169.851 130.817 167.877 130.133 165.625L121.367 135.937H100.977L104.359 147.312C104.359 147.414 104.414 147.523 104.438 147.625C104.793 149.225 104.785 150.884 104.413 152.48C104.042 154.077 103.316 155.569 102.29 156.847C101.264 158.125 99.9638 159.156 98.4856 159.864C97.0074 160.572 95.389 160.939 93.75 160.937H56.3594C55.4182 160.949 54.4953 160.677 53.711 160.156C43.4114 153.126 34.9849 143.686 29.1643 132.657C23.3437 121.629 20.305 109.345 20.3125 96.8749C20.3125 55.2577 54.1797 20.9218 95.7891 20.3124C105.934 20.1685 116.007 22.0426 125.422 25.8257C134.837 29.6088 143.405 35.2256 150.63 42.3494C157.855 49.4733 163.592 57.9622 167.507 67.3227C171.423 76.6832 173.439 86.7285 173.438 96.8749V99.9999C173.438 101.243 172.944 102.435 172.065 103.314C171.186 104.194 169.993 104.687 168.75 104.687H121.875L128.336 126.562H168.75C171.651 126.562 174.433 127.715 176.484 129.766C178.535 131.817 179.688 134.599 179.688 137.5ZM95.3125 149.773L83.1719 108.945C83.1719 108.836 83.1172 108.726 83.0938 108.625C82.7384 107.028 82.746 105.371 83.116 103.777C83.486 102.183 84.2089 100.692 85.2315 99.4148C86.2541 98.1373 87.5503 97.1056 89.0246 96.3956C90.4989 95.6856 92.1137 95.3154 93.75 95.3124H164.063C163.654 77.7653 156.396 61.0747 143.84 48.8105C131.284 36.5464 114.427 29.6826 96.875 29.6874H95.9063C59.375 30.203 29.6875 60.328 29.6875 96.8749C29.684 107.571 32.2341 118.113 37.126 127.625C42.0178 137.137 49.1099 145.344 57.8125 151.562H93.75C93.9757 151.565 94.1993 151.518 94.4053 151.426C94.6113 151.334 94.7949 151.198 94.9434 151.028C95.0919 150.858 95.2018 150.658 95.2655 150.441C95.3292 150.224 95.3453 149.997 95.3125 149.773ZM118.586 126.562L112.125 104.687H93.75C93.5243 104.685 93.3007 104.732 93.0947 104.824C92.8887 104.916 92.7051 105.052 92.5566 105.222C92.4081 105.392 92.2982 105.592 92.2345 105.809C92.1708 106.025 92.1548 106.253 92.1875 106.476L98.1719 126.562H118.586ZM170.313 137.5C170.313 137.085 170.148 136.688 169.855 136.395C169.562 136.102 169.164 135.937 168.75 135.937H131.133L139.109 162.945C139.206 163.271 139.407 163.556 139.68 163.758C139.954 163.959 140.285 164.066 140.625 164.062H168.75C169.164 164.062 169.562 163.898 169.855 163.605C170.148 163.312 170.313 162.914 170.313 162.5V137.5Z";

export function RunIcon({ size = 20 }: IconProps) {
  return filled(size, RUN_PATH);
}

export function PassIcon({ size = 20 }: IconProps) {
  return filled(size, PASS_PATH);
}

// No dedicated QB-run asset yet; reuse the carried-ball icon (the label
// distinguishes it from a handoff run).
export function QBRunIcon({ size = 20 }: IconProps) {
  return filled(size, RUN_PATH);
}

export function NeutralIcon({ size = 20 }: IconProps) {
  // Balanced = a football helmet (neutral — could run or pass).
  return filled(size, HELMET_PATH);
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <path d="M6 9 L12 15 L18 9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FitIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function DetailIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <circle cx="11" cy="11" r="6" strokeWidth="2" />
      <path d="M20 20 L16 16 M11 8 V14 M8 11 H14" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function FocusIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function ResetIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M19 12 A7 7 0 1 1 12 5 L16 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 2 L16 5 L13 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function EyeIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M2 12 S6 5 12 5 S22 12 22 12 S18 19 12 19 S2 12 2 12Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" strokeWidth="2" />
    </>,
  );
}

export function EyeOffIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M2 12 S6 5 12 5 S22 12 22 12 S18 19 12 19 S2 12 2 12Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" strokeWidth="2" />
      <path d="M4 4 L20 20" strokeWidth="2.2" strokeLinecap="round" />
    </>,
  );
}

export function StarIcon({ filled = false, size = 18 }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor">
      <path
        d="M12 3 L14.6 8.6 L20.8 9.3 L16.2 13.4 L17.5 19.5 L12 16.4 L6.5 19.5 L7.8 13.4 L3.2 9.3 L9.4 8.6 Z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LinkIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M9 15 L15 9" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 7 L12 5 A3.5 3.5 0 0 1 19 12 L17 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 17 L12 19 A3.5 3.5 0 0 1 5 12 L7 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function MoreIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function PlayIcon({ size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <path d="M7 5 L19 12 L7 19 Z" />
    </svg>
  );
}

export function PauseIcon({ size = 20 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function ReplayIcon({ size = 20 }: IconProps) {
  // Circular refresh arrow (feather rotate-ccw).
  return svg(
    size,
    <>
      <polyline points="1 4 1 10 7 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}


export function StrategyIcon({ size = 18 }: IconProps) {
  // Loose play diagram (two O's, two X's, route arrow) — used to shuffle a call.
  return svg(
    size,
    <>
      <circle cx="6" cy="5" r="2.1" strokeWidth="1.8" />
      <circle cx="11.5" cy="5" r="2.1" strokeWidth="1.8" />
      <path d="M4.3 9.3 L7.7 12.7 M7.7 9.3 L4.3 12.7" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.8 9.3 L13.2 12.7 M13.2 9.3 L9.8 12.7" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 18.5 L18.5 18.5 L18.5 8.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 11 L18.5 8.3 L21 11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>,
  );
}

export function PlaybookIcon({ size = 18 }: IconProps) {
  // A simple play-call clipboard (reads clearly at small sizes).
  return svg(
    size,
    <>
      {/* Clipboard body (gap at the top for the clip). */}
      <path
        d="M9 4 H6.5 A2 2 0 0 0 4.5 6 V20 A2 2 0 0 0 6.5 22 H17.5 A2 2 0 0 0 19.5 20 V6 A2 2 0 0 0 17.5 4 H15"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9" y="2.3" width="6" height="3.4" rx="1.3" strokeWidth="1.7" />
      <path d="M8 11 H16 M8 14.5 H16 M8 18 H12.5" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function LockIcon({ size = 16 }: IconProps) {
  // Locked: closed shackle + a solid body (with a cut-out keyhole) so it clearly
  // reads "locked."
  return svg(
    size,
    <>
      <path d="M7.5 10 V7 a4.5 4.5 0 0 1 9 0 V10" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="10" rx="2" fill="currentColor" stroke="none" />
      <rect x="11.1" y="13.3" width="1.8" height="4.2" rx="0.9" fill="#fff" stroke="none" />
    </>,
  );
}

export function LockOpenIcon({ size = 16 }: IconProps) {
  // Unlocked: open shackle + an outline body.
  return svg(
    size,
    <>
      <path d="M7.5 10 V7 a4.5 4.5 0 0 1 8.6 -1.7" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4.5" y="10" width="15" height="10" rx="2" strokeWidth="1.8" />
    </>,
  );
}

export function InfoIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
      <path d="M12 11 V16.5" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.8" r="1.15" fill="currentColor" stroke="none" />
    </>,
  );
}

export function SlidersIcon({ size = 20 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 7 H20 M4 12 H20 M4 17 H20" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="2.3" strokeWidth="2" fill="var(--surface)" />
      <circle cx="15" cy="12" r="2.3" strokeWidth="2" fill="var(--surface)" />
      <circle cx="8" cy="17" r="2.3" strokeWidth="2" fill="var(--surface)" />
    </>,
  );
}

export function CoachIcon({ size = 18 }: IconProps) {
  return svg(
    size,
    <>
      <path d="M4 6 H20 V15 H4 Z" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 10 H16 M8 12.5 H13" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 15 L7 19 M15 15 L17 19" strokeWidth="2" strokeLinecap="round" />
    </>,
  );
}

export function PanelIcon({ size = 18 }: IconProps) {
  // Two columns — toggles the side notes panel.
  return svg(
    size,
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
      <path d="M15 5 V19" strokeWidth="2" />
    </>,
  );
}

export function GhostIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="11" r="7" strokeWidth="2" strokeDasharray="4 4" />
      <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" stroke="none">
        SS
      </text>
    </svg>
  );
}
