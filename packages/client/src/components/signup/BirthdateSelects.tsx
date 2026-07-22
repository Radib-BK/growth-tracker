import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const y = year ? Number(year) : 0;
  const m = month ? Number(month) : 0;
  const days = y && m ? dayOptions(y, m) : [];

  return (
    <div className="flex gap-2">
      <Select value={year || undefined} onValueChange={onYearChange}>
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-year"
          aria-label={t("signup.birthYearAria")}
          aria-invalid={yearInvalid}
          onBlur={onYearBlur}
        >
          <SelectValue placeholder={t("signup.birthYearPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {yearOptions().map((yr) => (
            <SelectItem key={yr} value={String(yr)}>
              {yr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select key={year || "year-empty"} value={month || undefined} onValueChange={onMonthChange} disabled={!year}>
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-month"
          aria-label={t("signup.birthMonthAria")}
          aria-invalid={monthInvalid}
          onBlur={onMonthBlur}
        >
          <SelectValue placeholder={t("signup.birthMonthPlaceholder")} />
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
        key={`${year}-${month}`}
        value={day || undefined}
        onValueChange={onDayChange}
        disabled={!year || !month}
      >
        <SelectTrigger
          className="w-full"
          data-testid="birthdate-day"
          aria-label={t("signup.birthDayAria")}
          aria-invalid={dayInvalid}
          onBlur={onDayBlur}
        >
          <SelectValue placeholder={t("signup.birthDayPlaceholder")} />
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
