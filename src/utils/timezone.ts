import { DateTime } from "luxon";

// const timezone = ['Asia/Dubai','Europe/London','America/New_York','Asia/Kolkata','Australia/Sydney']

export function buildCompletionRecord({ completedAtUTC, timezone}: { completedAtUTC: Date; timezone: string;}) {
  console.log('completedAtUTC', completedAtUTC)
  console.log('timezone', timezone);
  
  const utc = DateTime.fromJSDate(completedAtUTC, { zone: 'utc' });
  console.log('utc converted to utc', utc);
  const local = utc.setZone(timezone);
  console.log('local converted to local', local)
  console.log('completed at local' , local.toISO());
  console.log('completed at ` day key', local.toFormat('yyyy-MM-dd'))
  
  
  if (!local.isValid) throw new Error(`Invalid timezone provided must be IANA, e.g. "Asia/Dubai": ${timezone}`);

  return {
    completedAtUTC,
    completedAtLocal: local.toISO(),
    dayKey: local.toFormat('yyyy-MM-dd')
  };
}
