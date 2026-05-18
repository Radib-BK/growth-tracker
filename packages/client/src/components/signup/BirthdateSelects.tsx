import { dayOptions, monthOptions, yearOptions } from "@/lib/birthdate";

type Props = {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
};

export function BirthdateSelects({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
}: Props) {
  const y = year ? Number(year) : 0;
  const m = month ? Number(month) : 0;
  const days = y && m ? dayOptions(y, m) : [];

  return (
    <div className="flex gap-2">
      <select
        data-testid="birthdate-year"
        aria-label="Birth year"
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Year
        </option>
        {yearOptions().map((yr) => (
          <option key={yr} value={String(yr)}>
            {yr}
          </option>
        ))}
      </select>

      <select
        data-testid="birthdate-month"
        aria-label="Birth month"
        value={month}
        disabled={!year}
        onChange={(e) => onMonthChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="" disabled>
          Month
        </option>
        {monthOptions().map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        data-testid="birthdate-day"
        aria-label="Birth day"
        value={day}
        disabled={!year || !month}
        onChange={(e) => onDayChange(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        <option value="" disabled>
          Day
        </option>
        {days.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
