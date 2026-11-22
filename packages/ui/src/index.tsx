import { displayValue, NOT_VERIFIED } from "@cric-atlas/domain";

export function VerifiedValue({ value }: { value: string | number | null | undefined }) {
  const text = displayValue(value);
  return <span className={text === NOT_VERIFIED ? "text-status-unknown italic" : undefined}>{text}</span>;
}

export function SampleDataBanner() {
  return (
    <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Demo data: permit, fee and availability details are samples. Do not rely on them.
    </div>
  );
}
