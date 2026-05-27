import type { ObjectId } from "mongodb";

export type AirportCode = "NZNE" | "YSSY" | "NZRO" | "NZGB" | "NZCI" | "NZTL";

export type Airport = {
  code: AirportCode;
  name: string;
  city: string;
  country: string;
  offsetMinutes: number;
};

export type LocalDateTime = {
  date: string;
  time: string;
  timezone: string;
};

export type Passenger = {
  _id?: ObjectId;
  sourceId?: number;
  title: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  createdAt: string;
};

export type Booking = {
  reference: string;
  passengerId?: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export type Schedule = {
  _id?: ObjectId;
  flightKey: string;
  flightNumber: string;
  routeName: string;
  origin: AirportCode;
  destination: AirportCode;
  aircraft: string;
  capacity: number;
  price: number;
  currency: "NZD";
  departureAt: string;
  arrivalAt: string;
  departureLocal: LocalDateTime;
  arrivalLocal: LocalDateTime;
  durationMinutes: number;
  bookings: Booking[];
  createdAt: string;
};

export type PublicSchedule = Omit<Schedule, "_id" | "bookings"> & {
  id: string;
  originAirport: Airport;
  destinationAirport: Airport;
  bookedSeats: number;
  seatsLeft: number;
};
