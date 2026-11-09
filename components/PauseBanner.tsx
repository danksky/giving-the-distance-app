export default function PauseBanner() {
  return (
    <aside
      aria-label="Site notice"
      className="bg-[#8B4ACC] px-4 py-2.5 text-center text-sm leading-6 text-white"
    >
      <strong className="font-semibold">Giving the Distance is on pause.</strong>{" "}
      New activities are no longer generating donations.
    </aside>
  );
}
