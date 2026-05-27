import type { Airport, AirportCode, PublicSchedule, Schedule } from "./types";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

export const airports: Record<AirportCode, Airport> = {
  NZNE: {
    code: "NZNE",
    name: "Dairy Flat Airport",
    city: "Dairy Flat",
    country: "New Zealand",
    offsetMinutes: 12 * 60
  },
  YSSY: {
    code: "YSSY",
    name: "Sydney Airport",
    city: "Sydney",
    country: "Australia",
    offsetMinutes: 10 * 60
  },
  NZRO: {
    code: "NZRO",
    name: "Rotorua Airport",
    city: "Rotorua",
    country: "New Zealand",
    offsetMinutes: 12 * 60
  },
  NZGB: {
    code: "NZGB",
    name: "Claris Airport",
    city: "Great Barrier Island",
    country: "New Zealand",
    offsetMinutes: 12 * 60
  },
  NZCI: {
    code: "NZCI",
    name: "Tuuta Airport",
    city: "Chatham Islands",
    country: "New Zealand",
    offsetMinutes: 12 * 60 + 45
  },
  NZTL: {
    code: "NZTL",
    name: "Lake Tekapo Airport",
    city: "Lake Tekapo",
    country: "New Zealand",
    offsetMinutes: 12 * 60
  }
};

type FlightTemplate = {
  flightNumber: string;
  routeName: string;
  origin: AirportCode;
  destination: AirportCode;
  aircraft: string;
  capacity: number;
  price: number;
  departureTime: string;
  durationMinutes: number;
};

const templates = {
  sydneyOut: {
    flightNumber: "DFA101",
    routeName: "Prestige Sydney Service",
    origin: "NZNE",
    destination: "YSSY",
    aircraft: "SyberJet SJ30i",
    capacity: 6,
    price: 1290,
    departureTime: "10:30",
    durationMinutes: 225
  },
  sydneyBack: {
    flightNumber: "DFA102",
    routeName: "Prestige Sydney Service",
    origin: "YSSY",
    destination: "NZNE",
    aircraft: "SyberJet SJ30i",
    capacity: 6,
    price: 1290,
    departureTime: "15:00",
    durationMinutes: 200
  },
  rotoruaEarlyOut: {
    flightNumber: "DFA201",
    routeName: "Rotorua Weekday Shuttle",
    origin: "NZNE",
    destination: "NZRO",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 210,
    departureTime: "07:00",
    durationMinutes: 45
  },
  rotoruaEarlyBack: {
    flightNumber: "DFA202",
    routeName: "Rotorua Weekday Shuttle",
    origin: "NZRO",
    destination: "NZNE",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 210,
    departureTime: "08:10",
    durationMinutes: 45
  },
  rotoruaLateOut: {
    flightNumber: "DFA203",
    routeName: "Rotorua Weekday Shuttle",
    origin: "NZNE",
    destination: "NZRO",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 240,
    departureTime: "16:30",
    durationMinutes: 45
  },
  rotoruaLateBack: {
    flightNumber: "DFA204",
    routeName: "Rotorua Weekday Shuttle",
    origin: "NZRO",
    destination: "NZNE",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 240,
    departureTime: "18:00",
    durationMinutes: 45
  },
  greatBarrierOut: {
    flightNumber: "DFA301",
    routeName: "Great Barrier Island Service",
    origin: "NZNE",
    destination: "NZGB",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 190,
    departureTime: "09:15",
    durationMinutes: 35
  },
  greatBarrierBack: {
    flightNumber: "DFA302",
    routeName: "Great Barrier Island Service",
    origin: "NZGB",
    destination: "NZNE",
    aircraft: "Cirrus SF50 Vision Jet",
    capacity: 4,
    price: 190,
    departureTime: "10:00",
    durationMinutes: 35
  },
  chathamOut: {
    flightNumber: "DFA401",
    routeName: "Chatham Islands Service",
    origin: "NZNE",
    destination: "NZCI",
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 760,
    departureTime: "09:00",
    durationMinutes: 130
  },
  chathamBack: {
    flightNumber: "DFA402",
    routeName: "Chatham Islands Service",
    origin: "NZCI",
    destination: "NZNE",
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 760,
    departureTime: "13:30",
    durationMinutes: 150
  },
  tekapoOut: {
    flightNumber: "DFA501",
    routeName: "Lake Tekapo Service",
    origin: "NZNE",
    destination: "NZTL",
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 520,
    departureTime: "11:00",
    durationMinutes: 105
  },
  tekapoBack: {
    flightNumber: "DFA502",
    routeName: "Lake Tekapo Service",
    origin: "NZTL",
    destination: "NZNE",
    aircraft: "HondaJet Elite",
    capacity: 5,
    price: 520,
    departureTime: "14:00",
    durationMinutes: 115
  }
} satisfies Record<string, FlightTemplate>;

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return isoDate(new Date(Date.UTC(year, month - 1, day) + days * DAY));
}

export function todayIsoDate() {
  return isoDate(new Date());
}

function dayOfWeek(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function localToUtcIso(date: string, time: string, airport: AirportCode) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const offset = airports[airport].offsetMinutes;
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - offset * MINUTE;
  return new Date(utcMs).toISOString();
}

function utcToLocal(iso: string, airport: AirportCode) {
  const local = new Date(new Date(iso).getTime() + airports[airport].offsetMinutes * MINUTE);
  const date = isoDate(local);
  const time = `${String(local.getUTCHours()).padStart(2, "0")}:${String(
    local.getUTCMinutes()
  ).padStart(2, "0")}`;

  return {
    date,
    time,
    timezone: utcOffsetLabel(airports[airport].offsetMinutes)
  };
}

function utcOffsetLabel(offsetMinutes: number) {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `GMT${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function makeSchedule(date: string, template: FlightTemplate): Schedule {
  const departureAt = localToUtcIso(date, template.departureTime, template.origin);
  const arrivalAt = new Date(new Date(departureAt).getTime() + template.durationMinutes * MINUTE)
    .toISOString();

  return {
    flightKey: `${template.flightNumber}-${date}-${template.origin}-${template.destination}-${template.departureTime}`,
    flightNumber: template.flightNumber,
    routeName: template.routeName,
    origin: template.origin,
    destination: template.destination,
    aircraft: template.aircraft,
    capacity: template.capacity,
    price: template.price,
    currency: "NZD",
    departureAt,
    arrivalAt,
    departureLocal: utcToLocal(departureAt, template.origin),
    arrivalLocal: utcToLocal(arrivalAt, template.destination),
    durationMinutes: template.durationMinutes,
    bookings: [],
    createdAt: new Date().toISOString()
  };
}

export function generateSchedules(startDate: string, numberOfDays = 120): Schedule[] {
  const schedules: Schedule[] = [];

  for (let offset = 0; offset < numberOfDays; offset += 1) {
    const date = addDays(startDate, offset);
    const dow = dayOfWeek(date);
    const isWeekday = dow >= 1 && dow <= 5;

    if (dow === 5) schedules.push(makeSchedule(date, templates.sydneyOut));
    if (dow === 0) schedules.push(makeSchedule(date, templates.sydneyBack));

    if (isWeekday) {
      schedules.push(makeSchedule(date, templates.rotoruaEarlyOut));
      schedules.push(makeSchedule(date, templates.rotoruaEarlyBack));
      schedules.push(makeSchedule(date, templates.rotoruaLateOut));
      schedules.push(makeSchedule(date, templates.rotoruaLateBack));
    }

    if ([1, 3, 5].includes(dow)) schedules.push(makeSchedule(date, templates.greatBarrierOut));
    if ([2, 4, 6].includes(dow)) schedules.push(makeSchedule(date, templates.greatBarrierBack));

    if ([2, 5].includes(dow)) schedules.push(makeSchedule(date, templates.chathamOut));
    if ([3, 6].includes(dow)) schedules.push(makeSchedule(date, templates.chathamBack));

    if (dow === 1) schedules.push(makeSchedule(date, templates.tekapoOut));
    if (dow === 2) schedules.push(makeSchedule(date, templates.tekapoBack));
  }

  return schedules;
}

export function publicSchedule(schedule: Schedule): PublicSchedule {
  const id = schedule._id?.toString() ?? schedule.flightKey;
  const bookedSeats = schedule.bookings?.length ?? 0;
  const { _id, bookings, ...scheduleDetails } = schedule;

  return {
    ...scheduleDetails,
    id,
    originAirport: airports[schedule.origin],
    destinationAirport: airports[schedule.destination],
    bookedSeats,
    seatsLeft: Math.max(0, schedule.capacity - bookedSeats)
  };
}

export function airportOptions() {
  return Object.values(airports);
}
