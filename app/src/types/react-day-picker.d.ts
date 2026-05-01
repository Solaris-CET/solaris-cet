declare module 'react-day-picker' {
  import * as React from 'react';

  export type Day = {
    date: Date;
  };

  export type DayModifiers = Record<string, boolean>;

  export type DayButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    day: Day;
    modifiers: DayModifiers;
  };

  export const DayButton: React.ComponentType<DayButtonProps>;

  export type CaptionLayout = 'label' | 'dropdown' | string;

  export type DayPickerFormatters = {
    formatMonthDropdown?: (date: Date) => string;
  } & Record<string, unknown>;

  export type DayPickerComponents = Record<string, any>;

  export type DayPickerProps = React.HTMLAttributes<HTMLDivElement> & {
    showOutsideDays?: boolean;
    showWeekNumber?: boolean;
    captionLayout?: CaptionLayout;
    className?: string;
    classNames?: Record<string, string>;
    formatters?: DayPickerFormatters;
    components?: DayPickerComponents;
  };

  export const DayPicker: React.ComponentType<DayPickerProps>;

  export function getDefaultClassNames(): Record<string, string>;
}
