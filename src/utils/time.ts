// src/utils/time.ts
import { DateTime } from "luxon";
// export const DEFAULT_TZ = "Europe/London";

// export const toLocalDayKey = (d: Date | string, tz = DEFAULT_TZ) =>
//   DateTime.fromJSDate(new Date(d), { zone: tz }).startOf("day").toISODate();

// export const startOfWeekLocal = (d: Date | string, tz = DEFAULT_TZ) =>
//   DateTime.fromJSDate(new Date(d), { zone: tz }).startOf("week"); // ISO week (Mon)

// export const nowLocal = (tz = DEFAULT_TZ) =>
//   DateTime.now().setZone(tz);


// const timezone = ['Asia/Dubai','Europe/London','America/New_York','Asia/Kolkata','Australia/Sydney']
// utils/time/buildCompletionRecord.ts
export function buildCompletionRecord({ completedAtUTC, timezone}: { completedAtUTC: Date; timezone: string;}) {
  const utc = DateTime.fromJSDate(completedAtUTC, { zone: 'utc' });
  const local = utc.setZone(timezone);
  
  if (!local.isValid) throw new Error(`Invalid timezone provided: ${timezone}`);

  return {
    completedAtUTC,
    completedAtLocal: local.toISO(),
    dayKey: local.toFormat('yyyy-MM-dd')
  };
}


// CODE FOR FLUTTER APP
 
// import 'package:flutter_native_timezone/flutter_native_timezone.dart';

// Future<String> getUserTimezone() async {
//   try {
//     final timezone = await FlutterNativeTimezone.getLocalTimezone();
//     return timezone; // e.g., 'Asia/Dubai'
//   } catch (e) {
//     print('Failed to get timezone: $e');
//     return 'UTC'; // fallback if error
//   }
// }
