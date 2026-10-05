import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const TODAY = new Date();
const TODAY_STR = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`;

function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
	return (
		<label htmlFor={htmlFor} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
			{children}
		</label>
	);
}

type DropdownPos = { top?: number; bottom?: number; left: number; width: number };

/** Paletas: "rojo" (aspirante / programa) y "oscuro" (superadmin). */
const TEMAS = {
	rojo: {
		trigger:     "border-gray-200 hover:border-gray-300",
		abierto:     "border-red-300 ring-2 ring-red-200",
		error:       "border-red-200",
		panel:       "border-gray-200",
		seleccionado: "bg-red-100 font-semibold text-red-700 ring-1 ring-red-200",
		hoy:         "font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50",
		actual:      "font-semibold text-red-700 hover:bg-red-50",
		zIndex:      9999,
	},
	oscuro: {
		trigger:     "border-gray-300 hover:border-gray-400",
		abierto:     "border-slate-400 ring-2 ring-slate-200",
		error:       "border-red-300",
		panel:       "border-gray-300",
		seleccionado: "bg-slate-100 font-semibold text-slate-700 ring-1 ring-slate-300",
		hoy:         "font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50",
		actual:      "font-semibold text-slate-600 hover:bg-slate-50",
		zIndex:      70,
	},
};

export type TemaPicker = keyof typeof TEMAS;

export function DatePicker({
	id,
	label,
	value,
	onChange,
	error,
	minDate,
	maxDate,
	disabled = false,
	tema = "rojo",
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	minDate?: string;
	maxDate?: string;
	disabled?: boolean;
	tema?: TemaPicker;
}) {
	const t = TEMAS[tema];
	type CalendarView = "days" | "months" | "years";

	const parsed = value ? new Date(value + "T00:00:00") : null;
	const validParsed = parsed && !isNaN(parsed.getTime()) ? parsed : null;

	const [open, setOpen] = useState(false);
	const [closing, setClosing] = useState(false);
	const [viewMode, setViewMode] = useState<CalendarView>("days");
	const [viewYear, setViewYear] = useState(() => {
		if (validParsed) return validParsed.getFullYear();
		if (maxDate) { const d = new Date(maxDate + "T00:00:00"); if (!isNaN(d.getTime())) return d.getFullYear(); }
		if (minDate) { const d = new Date(minDate + "T00:00:00"); if (!isNaN(d.getTime())) return d.getFullYear(); }
		return TODAY.getFullYear();
	});
	const [viewMonth, setViewMonth] = useState(() => {
		if (validParsed) return validParsed.getMonth();
		if (maxDate) { const d = new Date(maxDate + "T00:00:00"); if (!isNaN(d.getTime())) return d.getMonth(); }
		if (minDate) { const d = new Date(minDate + "T00:00:00"); if (!isNaN(d.getTime())) return d.getMonth(); }
		return TODAY.getMonth();
	});
	const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null);
	const [dropdownReady, setDropdownReady] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef  = useRef<HTMLDivElement>(null);

	const displayValue = validParsed
		? `${String(validParsed.getDate()).padStart(2, "0")}/${String(validParsed.getMonth() + 1).padStart(2, "0")}/${validParsed.getFullYear()}`
		: null;

	useEffect(() => {
		if (!value) {
			if (maxDate) { const d = new Date(maxDate + "T00:00:00"); if (!isNaN(d.getTime())) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); return; } }
			if (minDate) { const d = new Date(minDate + "T00:00:00"); if (!isNaN(d.getTime())) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); return; } }
			setViewYear(TODAY.getFullYear()); setViewMonth(TODAY.getMonth()); return;
		}
		const d = new Date(value + "T00:00:00");
		if (!isNaN(d.getTime())) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
	}, [value, maxDate, minDate]);

	// Calcula la posición inicial (siempre hacia abajo) para el primer render invisible
	function computeInitialPos(): DropdownPos {
		const width = 288;
		const margin = 8;
		const rect = containerRef.current?.getBoundingClientRect();
		if (!rect) return { top: 0, left: 0, width };
		const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, margin), window.innerWidth - width - margin);
		return { top: rect.bottom + 4, left, width };
	}

	// Después de que el portal renderiza, mide la altura real y decide la dirección
	useLayoutEffect(() => {
		if (!open || !dropdownRef.current || !containerRef.current) return;
		const actualHeight = dropdownRef.current.getBoundingClientRect().height;
		const rect = containerRef.current.getBoundingClientRect();
		const gap = 4;
		const margin = 8;
		const width = 288;
		const spaceBelow = window.innerHeight - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		const shouldOpenUpward = spaceBelow < actualHeight && spaceAbove > spaceBelow;
		const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, margin), window.innerWidth - width - margin);
		setDropdownPos({
			...(shouldOpenUpward ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
			left,
			width,
		});
		setDropdownReady(true);
	}, [open]);

	// Limpia el estado de visibilidad al cerrar
	useEffect(() => {
		if (!open) setDropdownReady(false);
	}, [open]);

	function closeCalendar() {
		setClosing(true);
		setTimeout(() => { setOpen(false); setClosing(false); setViewMode("days"); }, 120);
	}

	useEffect(() => {
		if (!open) return;
		function handleOutside(e: MouseEvent) {
			const target = e.target as Node;
			if (containerRef.current && !containerRef.current.contains(target) && !dropdownRef.current?.contains(target)) {
				closeCalendar();
			}
		}
		// Al hacer scroll/resize mantiene la dirección actual y solo actualiza coordenadas
		function updatePos() {
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;
			const gap = 4;
			const margin = 8;
			const width = 288;
			const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, margin), window.innerWidth - width - margin);
			setDropdownPos(prev => {
				if (!prev) return null;
				return {
					...(prev.bottom !== undefined ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap }),
					left,
					width,
				};
			});
		}
		document.addEventListener("mousedown", handleOutside);
		window.addEventListener("scroll", updatePos, true);
		window.addEventListener("resize", updatePos);
		return () => {
			document.removeEventListener("mousedown", handleOutside);
			window.removeEventListener("scroll", updatePos, true);
			window.removeEventListener("resize", updatePos);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	function prevPeriod() {
		if (viewMode === "days") { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); }
		else if (viewMode === "months") setViewYear((y) => y - 1);
		else setViewYear((y) => y - 12);
	}

	function nextPeriod() {
		if (viewMode === "days") { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); }
		else if (viewMode === "months") setViewYear((y) => y + 1);
		else setViewYear((y) => y + 12);
	}

	const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
	const startOffset = (firstDayOfMonth + 6) % 7;
	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
	const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

	type DayCell = { day: number; month: number; year: number; current: boolean };
	const cells: DayCell[] = [];
	for (let i = startOffset - 1; i >= 0; i--) {
		const m = viewMonth === 0 ? 11 : viewMonth - 1;
		const y = viewMonth === 0 ? viewYear - 1 : viewYear;
		cells.push({ day: daysInPrevMonth - i, month: m, year: y, current: false });
	}
	for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, month: viewMonth, year: viewYear, current: true });
	const totalCells = Math.ceil(cells.length / 7) * 7;
	for (let d = 1; d <= totalCells - cells.length; d++) {
		const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
		const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
		cells.push({ day: d, month: nextM, year: nextY, current: false });
	}

	function cellDateStr(cell: DayCell) {
		return `${cell.year}-${String(cell.month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
	}

	const yearStart = Math.floor(viewYear / 12) * 12;

	function headerLabel() {
		if (viewMode === "days") return `${MONTH_NAMES[viewMonth]} ${viewYear}`;
		if (viewMode === "months") return `${viewYear}`;
		return `${yearStart} – ${yearStart + 11}`;
	}

	const triggerClass = [
		"mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm text-left transition outline-none",
		disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
		error ? t.error : open ? t.abierto : t.trigger,
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
				disabled={disabled}
				onClick={() => {
					if (disabled) return;
					if (open) {
						closeCalendar();
					} else {
						setDropdownPos(computeInitialPos());
						setDropdownReady(false);
						setOpen(true);
					}
				}}
				className={triggerClass}
			>
				<span className={displayValue ? "text-gray-900" : "text-neutral-400"}>
					{displayValue ?? "dd/mm/aaaa"}
				</span>
				<CalendarDaysIcon className="h-4 w-4 shrink-0 text-neutral-400" />
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
						zIndex: t.zIndex,
						visibility: dropdownReady ? "visible" : "hidden",
					}}
					className={`rounded-lg border bg-white shadow-lg ${t.panel} ${dropdownReady ? animationClass : ""}`}
				>
					<div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
						<button type="button" onMouseDown={(e) => e.preventDefault()} onClick={prevPeriod}
							className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-gray-100 hover:text-gray-700">
							<ChevronLeftIcon className="h-4 w-4" />
						</button>
						<button type="button" onMouseDown={(e) => e.preventDefault()}
							onClick={() => { if (viewMode === "days") setViewMode("months"); else if (viewMode === "months") setViewMode("years"); }}
							className={["rounded-lg px-2 py-1 text-sm font-semibold text-gray-600 transition", viewMode !== "years" ? "hover:bg-gray-100" : "cursor-default"].join(" ")}>
							{headerLabel()}
						</button>
						<button type="button" onMouseDown={(e) => e.preventDefault()} onClick={nextPeriod}
							className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-gray-100 hover:text-gray-700">
							<ChevronRightIcon className="h-4 w-4" />
						</button>
					</div>

					{viewMode === "days" && (
						<>
							<div className="grid grid-cols-7 px-2 pt-2">
								{WEEK_DAYS.map((d) => (
									<div key={d} className="flex h-7 items-center justify-center text-xs font-semibold text-neutral-400">{d}</div>
								))}
							</div>
							<div className="grid grid-cols-7 px-2 pb-2">
								{cells.map((cell, i) => {
									const dateStr = cellDateStr(cell);
									const isSelected = dateStr === value;
									const isToday = dateStr === TODAY_STR;
									const isCellDisabled = Boolean((minDate && dateStr < minDate) || (maxDate && dateStr > maxDate));
									return (
										<div key={i} className="flex items-center justify-center py-0.5">
											<button type="button" disabled={isCellDisabled} onMouseDown={(e) => e.preventDefault()}
												onClick={() => { if (!isCellDisabled) { onChange(dateStr); closeCalendar(); } }}
												className={["h-8 w-8 flex items-center justify-center rounded-lg text-xs transition",
													isCellDisabled ? "text-neutral-300 cursor-not-allowed"
													: isSelected ? t.seleccionado
													: isToday ? t.hoy
													: cell.current ? "text-gray-900 hover:bg-gray-100"
													: "text-neutral-400 hover:bg-gray-100",
												].join(" ")}>
												{cell.day}
											</button>
										</div>
									);
								})}
							</div>
						</>
					)}

					{viewMode === "months" && (
						<div className="grid grid-cols-3 gap-1 p-3">
							{MONTH_SHORT.map((name, i) => {
								const isSelected = validParsed?.getMonth() === i && validParsed?.getFullYear() === viewYear;
								const isCurrentMonth = TODAY.getMonth() === i && TODAY.getFullYear() === viewYear;
								const firstDayStr = `${viewYear}-${String(i + 1).padStart(2, "0")}-01`;
								const lastDay = new Date(viewYear, i + 1, 0).getDate();
								const lastDayStr = `${viewYear}-${String(i + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
								const isMonthDisabled = Boolean((maxDate && firstDayStr > maxDate) || (minDate && lastDayStr < minDate));
								return (
									<button key={i} type="button" disabled={isMonthDisabled} onMouseDown={(e) => e.preventDefault()}
										onClick={() => { if (!isMonthDisabled) { setViewMonth(i); setViewMode("days"); } }}
										className={["rounded-lg py-2 text-sm transition",
											isMonthDisabled ? "text-neutral-300 cursor-not-allowed"
											: isSelected ? t.seleccionado
											: isCurrentMonth ? t.actual
											: "text-gray-900 hover:bg-gray-100",
										].join(" ")}>
										{name}
									</button>
								);
							})}
						</div>
					)}

					{viewMode === "years" && (
						<div className="grid grid-cols-3 gap-1 p-3">
							{Array.from({ length: 12 }, (_, i) => yearStart + i).map((year) => {
								const isSelected = validParsed?.getFullYear() === year;
								const isCurrentYear = TODAY.getFullYear() === year;
								const isYearDisabled = Boolean((maxDate && `${year}-01-01` > maxDate) || (minDate && `${year}-12-31` < minDate));
								return (
									<button key={year} type="button" disabled={isYearDisabled} onMouseDown={(e) => e.preventDefault()}
										onClick={() => { if (!isYearDisabled) { setViewYear(year); setViewMode("months"); } }}
										className={["rounded-lg py-2 text-sm transition",
											isYearDisabled ? "text-neutral-300 cursor-not-allowed"
											: isSelected ? t.seleccionado
											: isCurrentYear ? t.actual
											: "text-gray-900 hover:bg-gray-100",
										].join(" ")}>
										{year}
									</button>
								);
							})}
						</div>
					)}
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
