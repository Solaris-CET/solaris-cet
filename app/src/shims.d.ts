declare module 'gsap' {
  export type Tween = { kill: () => void };
  export type Timeline = Tween & {
    to: (...args: unknown[]) => Timeline;
    fromTo: (...args: unknown[]) => Timeline;
    set: (...args: unknown[]) => Timeline;
  };
  export type Context = { revert: () => void };

  export type Gsap = {
    registerPlugin: (...plugins: unknown[]) => void;
    context: (fn: () => void, scope?: unknown) => Context;
    set: (target: unknown, vars: Record<string, unknown>) => void;
    to: (target: unknown, vars: Record<string, unknown>) => Tween;
    fromTo: (target: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => Tween;
    timeline: (vars?: Record<string, unknown>) => Timeline;
    killTweensOf: (target: unknown) => void;
  };

  export const gsap: Gsap;
}

declare module 'gsap/ScrollTrigger' {
  export class ScrollTrigger {
    vars: Record<string, unknown>;
    start: number;
    end?: number;
    kill(): void;

    static create(vars: Record<string, unknown>): ScrollTrigger;
    static getAll(): ScrollTrigger[];
    static maxScroll(target: unknown): number;
  }
}

declare module 'lucide-react' {
    import * as React from 'react';

    export type LucideProps = React.SVGProps<SVGSVGElement> & {
      color?: string;
      size?: string | number;
      strokeWidth?: string | number;
      absoluteStrokeWidth?: boolean;
    };

    export type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;

    export function createLucideIcon(name: string, iconNode: unknown): LucideIcon;

    export const Activity: LucideIcon;
    export const AlertCircle: LucideIcon;
    export const AlertTriangle: LucideIcon;
    export const Anchor: LucideIcon;
    export const ArrowDown: LucideIcon;
    export const ArrowLeft: LucideIcon;
    export const ArrowLeftRight: LucideIcon;
    export const ArrowRight: LucideIcon;
    export const ArrowRightLeft: LucideIcon;
    export const ArrowUp: LucideIcon;
    export const ArrowUpDown: LucideIcon;
    export const Atom: LucideIcon;
    export const BadgeCheck: LucideIcon;
    export const BarChart2: LucideIcon;
    export const Battery: LucideIcon;
    export const BookOpen: LucideIcon;
    export const Bot: LucideIcon;
    export const Brain: LucideIcon;
    export const Building2: LucideIcon;
    export const Calculator: LucideIcon;
    export const Calendar: LucideIcon;
    export const CalendarClock: LucideIcon;
    export const CalendarDays: LucideIcon;
    export const Check: LucideIcon;
    export const CheckCircle: LucideIcon;
    export const CheckCircle2: LucideIcon;
    export const CheckIcon: LucideIcon;
    export const ChevronDown: LucideIcon;
    export const ChevronDownIcon: LucideIcon;
    export const ChevronLeft: LucideIcon;
    export const ChevronLeftIcon: LucideIcon;
    export const ChevronRight: LucideIcon;
    export const ChevronRightIcon: LucideIcon;
    export const ChevronUp: LucideIcon;
    export const ChevronUpIcon: LucideIcon;
    export const Circle: LucideIcon;
    export const CircleCheckIcon: LucideIcon;
    export const CircleIcon: LucideIcon;
    export const CircleX: LucideIcon;
    export const ClipboardList: LucideIcon;
    export const Clock: LucideIcon;
    export const CloudOff: LucideIcon;
    export const Code: LucideIcon;
    export const Code2: LucideIcon;
    export const Coins: LucideIcon;
    export const Compass: LucideIcon;
    export const Cookie: LucideIcon;
    export const Copy: LucideIcon;
    export const Cpu: LucideIcon;
    export const Crown: LucideIcon;
    export const Database: LucideIcon;
    export const Dna: LucideIcon;
    export const Download: LucideIcon;
    export const Droplets: LucideIcon;
    export const ExternalLink: LucideIcon;
    export const Eye: LucideIcon;
    export const EyeOff: LucideIcon;
    export const FileCheck: LucideIcon;
    export const FileSearch: LucideIcon;
    export const FileText: LucideIcon;
    export const Fingerprint: LucideIcon;
    export const Flag: LucideIcon;
    export const Flame: LucideIcon;
    export const Gauge: LucideIcon;
    export const Globe: LucideIcon;
    export const Globe2: LucideIcon;
    export const GripVertical: LucideIcon;
    export const GripVerticalIcon: LucideIcon;
    export const HardDriveDownload: LucideIcon;
    export const HelpCircle: LucideIcon;
    export const Home: LucideIcon;
    export const ImageIcon: LucideIcon;
    export const Info: LucideIcon;
    export const InfoIcon: LucideIcon;
    export const Landmark: LucideIcon;
    export const Laptop: LucideIcon;
    export const Layers: LucideIcon;
    export const Leaf: LucideIcon;
    export const Lightbulb: LucideIcon;
    export const LineChart: LucideIcon;
    export const Link2: LucideIcon;
    export const List: LucideIcon;
    export const Loader: LucideIcon;
    export const Loader2: LucideIcon;
    export const Loader2Icon: LucideIcon;
    export const Lock: LucideIcon;
    export const LogOut: LucideIcon;
    export const Mail: LucideIcon;
    export const MapPin: LucideIcon;
    export const Megaphone: LucideIcon;
    export const MessageCircle: LucideIcon;
    export const MessageSquare: LucideIcon;
    export const MessageSquareText: LucideIcon;
    export const MessageSquareWarning: LucideIcon;
    export const Mic: LucideIcon;
    export const Minus: LucideIcon;
    export const MinusIcon: LucideIcon;
    export const Monitor: LucideIcon;
    export const Moon: LucideIcon;
    export const MoreHorizontal: LucideIcon;
    export const MoreHorizontalIcon: LucideIcon;
    export const Network: LucideIcon;
    export const OctagonXIcon: LucideIcon;
    export const Palette: LucideIcon;
    export const PanelLeftIcon: LucideIcon;
    export const Paperclip: LucideIcon;
    export const Percent: LucideIcon;
    export const Pickaxe: LucideIcon;
    export const Pin: LucideIcon;
    export const Play: LucideIcon;
    export const PlugZap: LucideIcon;
    export const Plus: LucideIcon;
    export const Quote: LucideIcon;
    export const Radio: LucideIcon;
    export const RefreshCw: LucideIcon;
    export const RotateCcw: LucideIcon;
    export const Save: LucideIcon;
    export const Scale: LucideIcon;
    export const ScrollText: LucideIcon;
    export const Search: LucideIcon;
    export const SearchIcon: LucideIcon;
    export const Send: LucideIcon;
    export const Server: LucideIcon;
    export const Settings: LucideIcon;
    export const Share2: LucideIcon;
    export const Shield: LucideIcon;
    export const ShieldCheck: LucideIcon;
    export const SlidersHorizontal: LucideIcon;
    export const Smartphone: LucideIcon;
    export const Sparkles: LucideIcon;
    export const Star: LucideIcon;
    export const StopCircle: LucideIcon;
    export const Sun: LucideIcon;
    export const Tag: LucideIcon;
    export const ThumbsDown: LucideIcon;
    export const ThumbsUp: LucideIcon;
    export const Trash2: LucideIcon;
    export const TrendingDown: LucideIcon;
    export const TrendingUp: LucideIcon;
    export const TriangleAlertIcon: LucideIcon;
    export const Trophy: LucideIcon;
    export const UserCheck: LucideIcon;
    export const Users: LucideIcon;
    export const Volume2: LucideIcon;
    export const VolumeX: LucideIcon;
    export const Vote: LucideIcon;
    export const Wallet: LucideIcon;
    export const Wand2: LucideIcon;
    export const WifiOff: LucideIcon;
    export const X: LucideIcon;
    export const XCircle: LucideIcon;
    export const XIcon: LucideIcon;
    export const Zap: LucideIcon;
}

  declare module '@sentry/browser' {
    export type Scope = {
      setExtras: (extras: Record<string, unknown>) => void;
    };

    export function init(config: Record<string, unknown>): void;
    export function withScope(cb: (scope: Scope) => void): void;
    export function captureException(error: unknown): void;
  }

  declare module 'onnxruntime-web' {
    export const env: { wasm: { wasmPaths: string | Record<string, string> } };

    export class Tensor {
      data: unknown;
      constructor(type: string, data: Float32Array, dims: number[]);
      dispose(): void;
    }

    export class InferenceSession {
      inputNames: string[];
      outputNames: string[];
      run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
      static create(modelUrl: string, options?: Record<string, unknown>): Promise<InferenceSession>;
    }
  }

declare module 'react-day-picker' {
  import * as React from 'react';

  export type Day = { date: Date };
  export type Modifiers = Record<string, boolean>;
  export type DayButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    day: Day;
    modifiers: Modifiers;
  };
  export const DayButton: React.ComponentType<DayButtonProps>;

  export type DayPickerProps = React.HTMLAttributes<HTMLDivElement> & {
    showOutsideDays?: boolean;
    showWeekNumber?: boolean;
    captionLayout?: string;
    className?: string;
    classNames?: Record<string, string>;
    formatters?: { formatMonthDropdown?: (date: Date) => string } & Record<string, unknown>;
    components?: Record<string, any>;
  };

  export const DayPicker: React.ComponentType<DayPickerProps>;
  export function getDefaultClassNames(): Record<string, string>;
}
