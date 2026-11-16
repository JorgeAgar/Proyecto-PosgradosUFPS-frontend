import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClockIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
	return (
		<label htmlFor={htmlFor} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
			{children}
		</label>
	);
}

type Parsed = { hour12: number; period: "AM" | "PM"; minute: number };

function parseTime(value: string): Parsed | null {
	if (!value) return null;
	const [hStr, mStr] = value.split(":");
	const h = parseInt(hStr, 10);
	const m = parseInt(mStr, 10);
	if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
	const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
	const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
	return { hour12, period, minute: m };
}

function buildTime(hour12: number, period: "AM" | "PM", minute: number): string {
	const h = period === "AM"
		? (hour12 === 12 ? 0 : hour12)
		: (hour12 === 12 ? 12 : hour12 + 12);
	return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const HOURS_LIST   = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => i);
const ITEM_H       = 32; // py-2 (8 + 8) + text-xs lineheight (16 px) = 32 px

type DropdownPos = {
	top?: number;
	bottom?: number;
	left: number;
	width: number;
};

export function TimePicker({
	id,
	label,
	value,
	onChange,
	error,
	disabled,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	disabled?: boolean;
}) {
	const parsed = parseTime(value);

	const [open, setOpen]         = useState(false);
	const [closing, setClosing]   = useState(false);
	const [period, setPeriod]     = useState<"AM" | "PM">(parsed?.period ?? "AM");
	const [selHour, setSelHour]   = useState<number>(parsed?.hour12 ?? 12);
	const [selMin, setSelMin]     = useState<number>(parsed?.minute ?? 0);
	const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);

	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef  = useRef<HTMLDivElement>(null);
	const hoursRef     = useRef<HTMLDivElement>(null);
	const minsRef      = useRef<HTMLDivElement>(null);

	// Refs para capturar los valores actuales sin agregar dependencias al efecto de scroll.
	// Se actualizan en un efecto (antes del efecto de scroll, que se declara después).
	const selHourSnap = useRef(selHour);
	const selMinSnap  = useRef(selMin);
	useEffect(() => {
		selHourSnap.current = selHour;
		selMinSnap.current  = selMin;
	});

	const displayValue = parsed
		? `${parsed.hour12}:${String(parsed.minute).padStart(2, "0")} ${parsed.period}`
		: null;

	// Sincronizar estado interno cuando el valor cambia desde fuera
	// (ajuste durante el render guardando el valor previo, en lugar de un efecto).
	const [prevValue, setPrevValue] = useState(value);
	if (value !== prevValue) {
		setPrevValue(value);
		const p = parseTime(value);
		if (p) {
			setPeriod(p.period);
			setSelHour(p.hour12);
			setSelMin(p.minute);
		}
	}

	// Al abrir, hacer scroll hasta el ítem seleccionado en cada lista
	useEffect(() => {
		if (!open) return;
		const t = setTimeout(() => {
			const hIdx = HOURS_LIST.indexOf(selHourSnap.current as typeof HOURS_LIST[number]);
			if (hoursRef.current) {
				const ch = hoursRef.current.clientHeight;
				hoursRef.current.scrollTop = Math.max(0, hIdx * ITEM_H - ch / 2 + ITEM_H / 2);
			}
			if (minsRef.current) {
				const ch = minsRef.current.clientHeight;
				minsRef.current.scrollTop = Math.max(0, selMinSnap.current * ITEM_H - ch / 2 + ITEM_H / 2);
			}
		}, 0);
		return () => clearTimeout(t);
	}, [open]);

	function computePos(): DropdownPos | null {
		if (!containerRef.current) return null;
		const rect = containerRef.current.getBoundingClientRect();
		const dropdownWidth  = 208; // w-52
		const estimatedHeight = 280; // AM/PM ~44 + headers ~34 + lists 180 + padding
		const gap    = 4;
		const margin = 8;
		const spaceBelow = window.innerHeight - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
		const left = Math.min(
			Math.max(rect.left + rect.width / 2 - dropdownWidth / 2, margin),
			window.innerWidth - dropdownWidth - margin,
		);
		return {
			...(shouldOpenUpward
				? { bottom: window.innerHeight - rect.top + gap }
				: { top: rect.bottom + gap }
			),
			left,
			width: dropdownWidth,
		};
	}

	function closeDropdown() {
		setClosing(true);
		setTimeout(() => {
			setOpen(false);
			setClosing(false);
		}, 120);
	}

	useEffect(() => {
		if (!open) return;
		function handleOutside(e: MouseEvent) {
			const target = e.target as Node;
			if (
				containerRef.current && !containerRef.current.contains(target) &&
				!dropdownRef.current?.contains(target)
			) {
				closeDropdown();
			}
		}
		function updatePos() { setDropdownPos(computePos()); }
		document.addEventListener("mousedown", handleOutside);
		window.addEventListener("scroll", updatePos, true);
		window.addEventListener("resize", updatePos);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			window.removeEventListener("scroll", updatePos, true);
			window.removeEventListener("resize", updatePos);
		};
	}, [open]);

	function handleToggle() {
		if (disabled) return;
		if (open) {
			closeDropdown();
		} else {
			setDropdownPos(computePos());
			setOpen(true);
		}
	}

	function handleSelectHour(h: number) {
		setSelHour(h);
		onChange(buildTime(h, period, selMin));
	}

	function handleSelectMinute(m: number) {
		setSelMin(m);
		onChange(buildTime(selHour, period, m));
	}

	function handlePeriod(p: "AM" | "PM") {
		setPeriod(p);
		onChange(buildTime(selHour, p, selMin));
	}

	const triggerClass = [
		"mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition outline-none",
		disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-300",
		error ? "border-red-200" : open ? "border-red-300 ring-2 ring-red-200" : "border-gray-200",
	].join(" ");

	const openUpward = dropdownPos?.bottom !== undefined;
	const animationClass = closing
		? (openUpward ? "animate-dropdown-out-up" : "animate-dropdown-out")
		: (openUpward ? "animate-dropdown-in-up" : "animate-dropdown-in");

	return (
		<div ref={containerRef} className="relative">
			<Label htmlFor={id}>{label}</Label>
			<button
				id={id}
				type="button"
				onClick={handleToggle}
				disabled={disabled}
				className={triggerClass}
			>
				<span className={displayValue ? "text-gray-900" : "text-neutral-400"}>
					{displayValue ?? "hh:mm AM/PM"}
				</span>
				<ClockIcon className="h-4 w-4 shrink-0 text-neutral-400" />
			</button>

			{(open || closing) && dropdownPos && createPortal(
				<div
					ref={dropdownRef}
					style={{
						position: "fixed",
						top: dropdownPos.top,
						bottom: dropdownPos.bottom,
						left: dropdownPos.left,
						width: dropdownPos.width,
						zIndex: 9999,
					}}
					className={`rounded-lg border border-gray-200 bg-white shadow-lg ${animationClass}`}
				>
					{/* ── Toggle AM / PM ──────────────────────────────────── */}
					<div className="flex border-b border-gray-200">
						{(["AM", "PM"] as const).map((p, i) => (
							<button
								key={p}
								type="button"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => handlePeriod(p)}
								className={[
									"flex-1 py-2.5 text-sm font-semibold transition-colors",
									i === 1 ? "border-l border-gray-200" : "",
									period === p
										? "bg-red-100 text-red-700"
										: "text-gray-600 hover:bg-gray-50",
								].join(" ")}
							>
								{p}
							</button>
						))}
					</div>

					{/* ── Encabezados de columna ───────────────────────────── */}
					<div className="flex border-b border-gray-100">
						<div className="flex-1 py-1.5 text-center text-xs font-semibold text-neutral-400">
							Hora
						</div>
						<div className="w-px bg-gray-200" />
						<div className="flex-1 py-1.5 text-center text-xs font-semibold text-neutral-400">
							Min
						</div>
					</div>

					{/* ── Listas desplazables ──────────────────────────────── */}
					<div className="flex" style={{ height: 180 }}>

						{/* Lista de horas */}
						<div ref={hoursRef} className="scrollbar-hidden flex-1 overflow-y-auto py-1">
							{HOURS_LIST.map((h) => {
								const isSelected = parsed !== null && selHour === h && period === parsed.period;
								return (
									<button
										key={h}
										type="button"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSelectHour(h)}
										className={[
											"w-full py-2 text-xs text-center transition-colors",
											isSelected
												? "bg-red-100 font-semibold text-red-700"
												: "text-gray-900 hover:bg-gray-100",
										].join(" ")}
									>
										{h}
									</button>
								);
							})}
						</div>

						<div className="w-px bg-gray-200 self-stretch" />

						{/* Lista de minutos */}
						<div ref={minsRef} className="scrollbar-hidden flex-1 overflow-y-auto py-1">
							{MINUTES_LIST.map((m) => {
								const isSelected = parsed !== null && selMin === m && selHour === (parsed?.hour12 ?? -1) && period === parsed?.period;
								return (
									<button
										key={m}
										type="button"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSelectMinute(m)}
										className={[
											"w-full py-2 text-xs text-center transition-colors",
											isSelected
												? "bg-red-100 font-semibold text-red-700"
												: "text-gray-900 hover:bg-gray-100",
										].join(" ")}
									>
										{String(m).padStart(2, "0")}
									</button>
								);
							})}
						</div>
					</div>
				</div>,
				document.body,
			)}

			{error && (
				<p className="mt-1 inline-flex items-center gap-1 text-xs text-red-700">
					<ExclamationCircleIcon className="h-4 w-4 shrink-0" />
					{error}
				</p>
			)}
		</div>
	);
}
