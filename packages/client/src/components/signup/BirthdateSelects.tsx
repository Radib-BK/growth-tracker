import { dayOptions, monthOptions, yearOptions } from "@/lib/birthdate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  year: string;
  month: string;
  day: string;
  onYearChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  onYearBlur?: () => void;
  onMonthBlur?: () => void;
  onDayBlur?: () => void;
  yearInvalid?: boolean;
  monthInvalid?: boolean;
  dayInvalid?: boolean;
};

export function BirthdateSelects({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
  onYearBlur,
  onMonthBlur,
  onDayBlur,
  yearInvalid,
  monthInvalid,
  dayInvalid,
}: Props) {
  const y = year ? Number(year) : 0;
  const m = month ? Number(month) : 0;
  const days = y && m ? dayOptions(y, m) : [];

  return (
    <div className="flex gap-2">
      <Select value={year || undefined} onValueChange={onYearChange}>
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-year"
          aria-label="Birth year"
          aria-invalid={yearInvalid}
          onBlur={onYearBlur}
        >
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions().map((yr) => (
            <SelectItem key={yr} value={String(yr)}>
              {yr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={month || undefined}
        onValueChange={onMonthChange}
        disabled={!year}
      >
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-month"
          aria-label="Birth month"
          aria-invalid={monthInvalid}
          onBlur={onMonthBlur}
        >
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions().map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={day || undefined}
        onValueChange={onDayChange}
        disabled={!year || !month}
      >
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-day"
          aria-label="Birth day"
          aria-invalid={dayInvalid}
          onBlur={onDayBlur}
        >
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
