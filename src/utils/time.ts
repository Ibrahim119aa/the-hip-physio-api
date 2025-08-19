// src/utils/time.ts
import { DateTime } from "luxon";
export const DEFAULT_TZ = "Europe/London";

export const toLocalDayKey = (d: Date | string, tz = DEFAULT_TZ) =>
  DateTime.fromJSDate(new Date(d), { zone: tz }).startOf("day").toISODate();

export const startOfWeekLocal = (d: Date | string, tz = DEFAULT_TZ) =>
  DateTime.fromJSDate(new Date(d), { zone: tz }).startOf("week"); // ISO week (Mon)

export const nowLocal = (tz = DEFAULT_TZ) =>
  DateTime.now().setZone(tz);
