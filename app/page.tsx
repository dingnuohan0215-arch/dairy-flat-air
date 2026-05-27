"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Airport = {
  code: string;
  name: string;
  city: string;
  country: string;
};

type PublicSchedule = {
  id: string;
  flightNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  originAirport: Airport;
  destinationAirport: Airport;
  aircraft: string;
  capacity: number;
  price: number;
  currency: "NZD";
  departureLocal: {
    date: string;
    time: string;
    timezone: string;
  };
  arrivalLocal: {
    date: string;
    time: string;
    timezone: string;
  };
  durationMinutes: number;
  bookedSeats: number;
  seatsLeft: number;
};

type Booking = {
  reference: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type Invoice = {
  booking: Booking;
  schedule: PublicSchedule;
};

type PassengerBooking = {
  booking: Booking;
  schedule: PublicSchedule;
};

type RouteGuide = {
  origin: string;
  destination: string;
  label: string;
  frequency: string;
  aircraft: string;
  advice: string;
  windowDays: number;
  service: string;
};

type SearchCriteria = {
  origin: string;
  destination: string;
  date1: string;
  date2: string;
};

const airports = [
  { code: "NZNE", name: "Dairy Flat Airport", city: "Dairy Flat", country: "New Zealand" },
  { code: "YSSY", name: "Sydney Airport", city: "Sydney", country: "Australia" },
  { code: "NZRO", name: "Rotorua Airport", city: "Rotorua", country: "New Zealand" },
  { code: "NZGB", name: "Claris Airport", city: "Great Barrier Island", country: "New Zealand" },
  { code: "NZCI", name: "Tuuta Airport", city: "Chatham Islands", country: "New Zealand" },
  { code: "NZTL", name: "Lake Tekapo Airport", city: "Lake Tekapo", country: "New Zealand" }
];

const routeGuides: RouteGuide[] = [
  {
    origin: "NZNE",
    destination: "YSSY",
    label: "Sydney prestige",
    frequency: "Outbound every Friday, return every Sunday",
    aircraft: "SyberJet SJ30i, 6 seats",
    advice: "Sydney is a weekly route, so a 35 day search is the easiest way to see options.",
    windowDays: 35,
    service: "International"
  },
  {
    origin: "YSSY",
    destination: "NZNE",
    label: "Sydney return",
    frequency: "Return service every Sunday",
    aircraft: "SyberJet SJ30i, 6 seats",
    advice: "Use a five week window to avoid missing the once-weekly Sunday return.",
    windowDays: 35,
    service: "International"
  },
  {
    origin: "NZNE",
    destination: "NZRO",
    label: "Rotorua shuttle",
    frequency: "Two flights each weekday",
    aircraft: "Cirrus SF50 Vision Jet, 4 seats",
    advice: "Rotorua has the most frequent service, so a one week search is usually enough.",
    windowDays: 7,
    service: "Weekday shuttle"
  },
  {
    origin: "NZRO",
    destination: "NZNE",
    label: "Rotorua return",
    frequency: "Two return flights each weekday",
    aircraft: "Cirrus SF50 Vision Jet, 4 seats",
    advice: "Morning and evening returns run on weekdays for commuter-style travel.",
    windowDays: 7,
    service: "Weekday shuttle"
  },
  {
    origin: "NZNE",
    destination: "NZGB",
    label: "Great Barrier",
    frequency: "Outbound Monday, Wednesday, Friday",
    aircraft: "Cirrus SF50 Vision Jet, 4 seats",
    advice: "Search at least two weeks for this route because seats are limited.",
    windowDays: 14,
    service: "Island connection"
  },
  {
    origin: "NZGB",
    destination: "NZNE",
    label: "Great Barrier return",
    frequency: "Return Tuesday, Thursday, Saturday",
    aircraft: "Cirrus SF50 Vision Jet, 4 seats",
    advice: "Return flights run the day after the outbound pattern.",
    windowDays: 14,
    service: "Island connection"
  },
  {
    origin: "NZNE",
    destination: "NZCI",
    label: "Chatham Islands",
    frequency: "Outbound Tuesday and Friday",
    aircraft: "HondaJet Elite, 5 seats",
    advice: "Chatham time is GMT+12:45, so check both the local departure and arrival times.",
    windowDays: 21,
    service: "Remote island"
  },
  {
    origin: "NZCI",
    destination: "NZNE",
    label: "Chatham return",
    frequency: "Return Wednesday and Saturday",
    aircraft: "HondaJet Elite, 5 seats",
    advice: "The return schedule uses Chatham local time and a slightly longer westbound duration.",
    windowDays: 21,
    service: "Remote island"
  },
  {
    origin: "NZNE",
    destination: "NZTL",
    label: "Lake Tekapo",
    frequency: "Outbound every Monday",
    aircraft: "HondaJet Elite, 5 seats",
    advice: "Lake Tekapo is weekly, so use a 28 day window for a useful list.",
    windowDays: 28,
    service: "Scenic connection"
  },
  {
    origin: "NZTL",
    destination: "NZNE",
    label: "Lake Tekapo return",
    frequency: "Return every Tuesday",
    aircraft: "HondaJet Elite, 5 seats",
    advice: "Tuesday returns pair with the Monday outbound service.",
    windowDays: 28,
    service: "Scenic connection"
  }
];

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0
  }).format(value);
}

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

function airportLabel(code: string) {
  const airport = airports.find((item) => item.code === code);
  return airport ? `${airport.city} (${airport.code})` : code;
}

function routeGuideFor(origin: string, destination: string) {
  return routeGuides.find((guide) => guide.origin === origin && guide.destination === destination);
}

function seatLabel(schedule: PublicSchedule) {
  if (schedule.seatsLeft < 1) return "Full";
  if (schedule.seatsLeft === 1) return "1 seat left";
  return `${schedule.seatsLeft} seats left`;
}

export default function Home() {
  const [origin, setOrigin] = useState("NZNE");
  const [destination, setDestination] = useState("YSSY");
  const [date1, setDate1] = useState(addDays(1));
  const [date2, setDate2] = useState(addDays(28));
  const [schedules, setSchedules] = useState<PublicSchedule[]>([]);
  const [selected, setSelected] = useState<PublicSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [cancelReference, setCancelReference] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [passengerBookings, setPassengerBookings] = useState<PassengerBooking[]>([]);
  const [bookingForm, setBookingForm] = useState({
    title: "Ms",
    firstName: "",
    lastName: "",
    email: ""
  });

  const visibleSchedules = useMemo(() => schedules, [schedules]);
  const currentGuide = useMemo(() => routeGuideFor(origin, destination), [origin, destination]);
  const relatedGuides = useMemo(
    () => routeGuides.filter((guide) => guide.origin === origin),
    [origin]
  );
  const openSeats = useMemo(
    () => visibleSchedules.reduce((total, schedule) => total + schedule.seatsLeft, 0),
    [visibleSchedules]
  );

  function changeOrigin(nextOrigin: string) {
    setOrigin(nextOrigin);
    if (destination === nextOrigin || !routeGuideFor(nextOrigin, destination)) {
      const nextGuide = routeGuides.find((guide) => guide.origin === nextOrigin);
      const nextDestination =
        nextGuide?.destination ?? airports.find((airport) => airport.code !== nextOrigin)?.code;
      if (nextDestination) setDestination(nextDestination);
    }
  }

  async function runSearch(criteria: SearchCriteria) {
    setLoading(true);
    setMessage("");
    setInvoice(null);

    try {
      const params = new URLSearchParams({
        orig: criteria.origin,
        dest: criteria.destination,
        date1: criteria.date1,
        date2: criteria.date2
      });
      const response = await fetch(`/api/schedules?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Search failed.");

      setSchedules(data.schedules);
      setSelected(data.schedules[0] ?? null);
      if (data.schedules.length === 0) {
        setMessage("No flights match that search. Try the route guide window below.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function searchFlights(event?: FormEvent) {
    event?.preventDefault();
    await runSearch({ origin, destination, date1, date2 });
  }

  async function applyRouteGuide(guide: RouteGuide) {
    const nextDate1 = addDays(1);
    const nextDate2 = addDays(guide.windowDays);
    setOrigin(guide.origin);
    setDestination(guide.destination);
    setDate1(nextDate1);
    setDate2(nextDate2);
    await runSearch({
      origin: guide.origin,
      destination: guide.destination,
      date1: nextDate1,
      date2: nextDate2
    });
  }

  async function bookFlight(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: selected.id,
          ...bookingForm
        })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Booking failed.");

      setInvoice(data);
      setCancelReference(data.booking.reference);
      setSelected(data.schedule);
      setSchedules((current) =>
        current.map((schedule) => (schedule.id === data.schedule.id ? data.schedule : schedule))
      );
      setMessage("Booking confirmed. The invoice is ready on the right.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const reference = cancelReference.trim().toUpperCase();
      const response = await fetch(`/api/bookings/${encodeURIComponent(reference)}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Cancellation failed.");

      setSchedules((current) =>
        current.map((schedule) => (schedule.id === data.schedule.id ? data.schedule : schedule))
      );
      if (selected?.id === data.schedule.id) setSelected(data.schedule);
      setInvoice(null);
      setMessage(`Cancelled ${reference}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cancellation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupPassenger(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams({ email: lookupEmail.trim().toLowerCase() });
      const response = await fetch(`/api/passengers?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Lookup failed.");

      setPassengerBookings(data.bookings.filter((item: PassengerBooking) => item.booking));
      if (data.bookings.length === 0) setMessage("No bookings found for that passenger.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    searchFlights();
    // The first search should run once when the desk opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Dairy Flat Air</p>
          <h1>Regional flight booking desk</h1>
          <p className="hero-lede">
            Search real calendar services from Dairy Flat, reserve a seat, print the invoice, or
            manage an existing passenger booking.
          </p>

          <div className="stats-row" aria-label="Booking system highlights">
            <div>
              <strong>120</strong>
              <span>schedule days</span>
            </div>
            <div>
              <strong>6</strong>
              <span>destinations</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>seat inventory</span>
            </div>
          </div>
        </div>

        <form className="panel search-panel" onSubmit={searchFlights}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Search</p>
              <h2>Find a scheduled flight</h2>
            </div>
            <span>{loading ? "Updating" : `${visibleSchedules.length} results`}</span>
          </div>

          <div className="field-grid">
            <label>
              Origin
              <select value={origin} onChange={(event) => changeOrigin(event.target.value)}>
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.city} ({airport.code})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Destination
              <select value={destination} onChange={(event) => setDestination(event.target.value)}>
                {airports
                  .filter((airport) => airport.code !== origin)
                  .map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <div className="field-grid">
            <label>
              From
              <input type="date" value={date1} onChange={(event) => setDate1(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={date2} onChange={(event) => setDate2(event.target.value)} />
            </label>
          </div>

          <div className="route-guide">
            <div>
              <span className="guide-chip">{currentGuide?.service ?? "Route"}</span>
              <h3>{currentGuide?.label ?? "Custom route"}</h3>
              <p>{currentGuide?.frequency ?? "Choose a route served by Dairy Flat Air."}</p>
              <p className="guide-advice">
                {currentGuide?.advice ?? "Use the destination buttons below to pick a served route."}
              </p>
            </div>
            <button
              className="text-action"
              disabled={!currentGuide || loading}
              onClick={() => currentGuide && applyRouteGuide(currentGuide)}
              type="button"
            >
              Use suggested window
            </button>
          </div>

          <div className="destination-grid" aria-label="Route shortcuts">
            {relatedGuides.map((guide) => (
              <button
                className={guide.destination === destination ? "route-shortcut active" : "route-shortcut"}
                key={`${guide.origin}-${guide.destination}`}
                onClick={() => applyRouteGuide(guide)}
                type="button"
              >
                <strong>{airportLabel(guide.destination)}</strong>
                <span>{guide.frequency}</span>
              </button>
            ))}
          </div>

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search flights"}
          </button>
        </form>
      </section>

      <section className="route-map-band" aria-label="Route map">
        <div>
          <p className="eyebrow">Network</p>
          <h2>Dairy Flat routes use the assignment aircraft and weekly timetable.</h2>
        </div>
        <Image
          className="route-map"
          src="/route-map.svg"
          alt="Dairy Flat Air route map"
          width={900}
          height={560}
          priority
        />
      </section>

      <section className="workspace">
        <section className="results-column">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Available flights</p>
              <h2>
                {airportLabel(origin)} to {airportLabel(destination)}
              </h2>
            </div>
            <div className="summary-pill">
              {visibleSchedules.length} flights, {openSeats} open seats
            </div>
          </div>

          {message && <div className="notice">{message}</div>}

          <div className="results-grid">
            {visibleSchedules.map((schedule) => (
              <button
                className={`flight-card ${selected?.id === schedule.id ? "selected" : ""} ${
                  schedule.seatsLeft < 1 ? "full" : ""
                }`}
                key={schedule.id}
                onClick={() => {
                  setSelected(schedule);
                  setInvoice(null);
                }}
                type="button"
              >
                <div className="card-topline">
                  <span className="flight-code">{schedule.flightNumber}</span>
                  <span className={schedule.seatsLeft < 1 ? "seat-pill full" : "seat-pill"}>
                    {seatLabel(schedule)}
                  </span>
                </div>
                <strong className="route-title">
                  {schedule.origin} to {schedule.destination}
                </strong>
                <span className="city-line">
                  {schedule.originAirport.city} to {schedule.destinationAirport.city}
                </span>
                <div className="time-grid">
                  <span>
                    <b>{schedule.departureLocal.time}</b>
                    {schedule.departureLocal.date}
                    <small>{schedule.departureLocal.timezone}</small>
                  </span>
                  <span>
                    <b>{schedule.arrivalLocal.time}</b>
                    {schedule.arrivalLocal.date}
                    <small>{schedule.arrivalLocal.timezone}</small>
                  </span>
                </div>
                <div className="card-meta">
                  <span>{minutesLabel(schedule.durationMinutes)}</span>
                  <span>{schedule.aircraft}</span>
                  <span className="fare-pill">{money(schedule.price)}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="panel booking-panel">
          {selected ? (
            <>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Selected flight</p>
                  <h2>{selected.flightNumber}</h2>
                </div>
                <span>{selected.routeName}</span>
              </div>

              <div className="flight-summary">
                <div>
                  <span>From</span>
                  <strong>{selected.origin}</strong>
                  <p>{selected.originAirport.name}</p>
                </div>
                <div>
                  <span>To</span>
                  <strong>{selected.destination}</strong>
                  <p>{selected.destinationAirport.name}</p>
                </div>
              </div>

              <dl className="flight-details">
                <div>
                  <dt>Depart</dt>
                  <dd>
                    {selected.departureLocal.date} at {selected.departureLocal.time}{" "}
                    {selected.departureLocal.timezone}
                  </dd>
                </div>
                <div>
                  <dt>Arrive</dt>
                  <dd>
                    {selected.arrivalLocal.date} at {selected.arrivalLocal.time}{" "}
                    {selected.arrivalLocal.timezone}
                  </dd>
                </div>
                <div>
                  <dt>Aircraft</dt>
                  <dd>{selected.aircraft}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{minutesLabel(selected.durationMinutes)}</dd>
                </div>
                <div>
                  <dt>Fare</dt>
                  <dd>{money(selected.price)}</dd>
                </div>
                <div>
                  <dt>Seats</dt>
                  <dd>
                    {seatLabel(selected)} of {selected.capacity}
                  </dd>
                </div>
              </dl>

              <form className="booking-form" onSubmit={bookFlight}>
                <div className="panel-heading compact-heading">
                  <h2>Passenger details</h2>
                </div>
                <div className="field-grid compact">
                  <label>
                    Title
                    <select
                      value={bookingForm.title}
                      onChange={(event) =>
                        setBookingForm((current) => ({ ...current, title: event.target.value }))
                      }
                    >
                      <option>Ms</option>
                      <option>Miss</option>
                      <option>Mrs</option>
                      <option>Mr</option>
                      <option>Mx</option>
                    </select>
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(event) =>
                        setBookingForm((current) => ({ ...current, email: event.target.value }))
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  First name
                  <input
                    value={bookingForm.firstName}
                    onChange={(event) =>
                      setBookingForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={bookingForm.lastName}
                    onChange={(event) =>
                      setBookingForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    required
                  />
                </label>
                <button className="primary" type="submit" disabled={loading || selected.seatsLeft < 1}>
                  {selected.seatsLeft < 1 ? "Flight full" : "Book seat"}
                </button>
              </form>

              {invoice && (
                <section className="invoice" aria-live="polite">
                  <div className="invoice-top">
                    <div>
                      <p className="eyebrow">Booking invoice</p>
                      <h2>{invoice.booking.reference}</h2>
                    </div>
                    <span>Confirmed</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Passenger</dt>
                      <dd>
                        {invoice.booking.title} {invoice.booking.firstName}{" "}
                        {invoice.booking.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{invoice.booking.email}</dd>
                    </div>
                    <div>
                      <dt>Flight</dt>
                      <dd>
                        {invoice.schedule.flightNumber}, {invoice.schedule.origin} to{" "}
                        {invoice.schedule.destination}
                      </dd>
                    </div>
                    <div>
                      <dt>Departure</dt>
                      <dd>
                        {invoice.schedule.departureLocal.date} at{" "}
                        {invoice.schedule.departureLocal.time}{" "}
                        {invoice.schedule.departureLocal.timezone}
                      </dd>
                    </div>
                    <div>
                      <dt>Arrival</dt>
                      <dd>
                        {invoice.schedule.arrivalLocal.date} at{" "}
                        {invoice.schedule.arrivalLocal.time}{" "}
                        {invoice.schedule.arrivalLocal.timezone}
                      </dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{money(invoice.schedule.price)}</dd>
                    </div>
                  </dl>
                </section>
              )}
            </>
          ) : (
            <div className="empty-state">No scheduled flight selected.</div>
          )}
        </aside>
      </section>

      <section className="lower-grid">
        <form className="panel" onSubmit={cancelBooking}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Manage</p>
              <h2>Cancel booking</h2>
            </div>
          </div>
          <label>
            Booking reference
            <input
              value={cancelReference}
              onChange={(event) => setCancelReference(event.target.value)}
              placeholder="DFA-..."
              required
            />
          </label>
          <button className="secondary" type="submit" disabled={loading}>
            Cancel booking
          </button>
        </form>

        <form className="panel" onSubmit={lookupPassenger}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Passenger</p>
              <h2>Find itinerary</h2>
            </div>
            <span>{passengerBookings.length} found</span>
          </div>
          <label>
            Passenger email
            <input
              type="email"
              value={lookupEmail}
              onChange={(event) => setLookupEmail(event.target.value)}
              required
            />
          </label>
          <button className="secondary" type="submit" disabled={loading}>
            Find bookings
          </button>
        </form>

        <section className="panel booking-list">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Records</p>
              <h2>Booked flights</h2>
            </div>
          </div>
          {passengerBookings.length === 0 ? (
            <div className="empty-state">No passenger bookings loaded.</div>
          ) : (
            passengerBookings.map((item) => (
              <article className="mini-card" key={item.booking.reference}>
                <strong>{item.booking.reference}</strong>
                <span>
                  {item.schedule.flightNumber}: {airportLabel(item.schedule.origin)} to{" "}
                  {airportLabel(item.schedule.destination)}
                </span>
                <span>
                  {item.schedule.departureLocal.date} at {item.schedule.departureLocal.time}{" "}
                  {item.schedule.departureLocal.timezone}
                </span>
                <span>{money(item.schedule.price)}</span>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
