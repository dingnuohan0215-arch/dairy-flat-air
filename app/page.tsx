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

const airports = [
  { code: "NZNE", name: "Dairy Flat Airport", city: "Dairy Flat", country: "New Zealand" },
  { code: "YSSY", name: "Sydney Airport", city: "Sydney", country: "Australia" },
  { code: "NZRO", name: "Rotorua Airport", city: "Rotorua", country: "New Zealand" },
  { code: "NZGB", name: "Claris Airport", city: "Great Barrier Island", country: "New Zealand" },
  { code: "NZCI", name: "Tuuta Airport", city: "Chatham Islands", country: "New Zealand" },
  { code: "NZTL", name: "Lake Tekapo Airport", city: "Lake Tekapo", country: "New Zealand" }
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

  function changeOrigin(nextOrigin: string) {
    setOrigin(nextOrigin);
    if (destination === nextOrigin) {
      const nextDestination = airports.find((airport) => airport.code !== nextOrigin)?.code;
      if (nextDestination) setDestination(nextDestination);
    }
  }

  async function searchFlights(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setMessage("");
    setInvoice(null);

    try {
      const params = new URLSearchParams({
        orig: origin,
        dest: destination,
        date1,
        date2
      });
      const response = await fetch(`/api/schedules?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Search failed.");

      setSchedules(data.schedules);
      setSelected(data.schedules[0] ?? null);
      if (data.schedules.length === 0) setMessage("No flights match that search.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
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
      setMessage("Booking confirmed.");
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
      <section className="topbar">
        <div>
          <p className="eyebrow">Dairy Flat Air</p>
          <h1>Flight desk</h1>
        </div>
        <div className="status-pill">{loading ? "Working" : "Ready"}</div>
      </section>

      <section className="workspace">
        <form className="panel search-panel" onSubmit={searchFlights}>
          <div className="panel-heading">
            <h2>Search flights</h2>
            <span>{visibleSchedules.length} results</span>
          </div>

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

          <button className="primary" type="submit" disabled={loading}>
            Search
          </button>

          <Image
            className="route-map"
            src="/route-map.svg"
            alt="Dairy Flat Air route map"
            width={900}
            height={560}
            priority
          />
        </form>

        <section className="results-column">
          {message && <div className="notice">{message}</div>}

          <div className="results-grid">
            {visibleSchedules.map((schedule) => (
              <button
                className={`flight-card ${selected?.id === schedule.id ? "selected" : ""}`}
                key={schedule.id}
                onClick={() => {
                  setSelected(schedule);
                  setInvoice(null);
                }}
                type="button"
              >
                <span className="flight-code">{schedule.flightNumber}</span>
                <strong>
                  {airportLabel(schedule.origin)} to {airportLabel(schedule.destination)}
                </strong>
                <span>
                  {schedule.departureLocal.date} at {schedule.departureLocal.time}{" "}
                  {schedule.departureLocal.timezone}
                </span>
                <span>
                  {schedule.aircraft} · {schedule.seatsLeft}/{schedule.capacity} seats ·{" "}
                  {money(schedule.price)}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="panel booking-panel">
          {selected ? (
            <>
              <div className="panel-heading">
                <h2>{selected.flightNumber}</h2>
                <span>{selected.routeName}</span>
              </div>

              <dl className="flight-details">
                <div>
                  <dt>Depart</dt>
                  <dd>
                    {selected.originAirport.city}, {selected.departureLocal.date}{" "}
                    {selected.departureLocal.time}
                  </dd>
                </div>
                <div>
                  <dt>Arrive</dt>
                  <dd>
                    {selected.destinationAirport.city}, {selected.arrivalLocal.date}{" "}
                    {selected.arrivalLocal.time}
                  </dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{minutesLabel(selected.durationMinutes)}</dd>
                </div>
                <div>
                  <dt>Fare</dt>
                  <dd>{money(selected.price)}</dd>
                </div>
              </dl>

              <form className="booking-form" onSubmit={bookFlight}>
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
                  Book seat
                </button>
              </form>

              {invoice && (
                <section className="invoice" aria-live="polite">
                  <p className="eyebrow">Invoice</p>
                  <h2>{invoice.booking.reference}</h2>
                  <dl>
                    <div>
                      <dt>Passenger</dt>
                      <dd>
                        {invoice.booking.title} {invoice.booking.firstName} {invoice.booking.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt>Flight</dt>
                      <dd>
                        {invoice.schedule.flightNumber}, {invoice.schedule.origin} to{" "}
                        {invoice.schedule.destination}
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
            <h2>Cancel booking</h2>
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
            Cancel
          </button>
        </form>

        <form className="panel" onSubmit={lookupPassenger}>
          <div className="panel-heading">
            <h2>Passenger bookings</h2>
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
            <h2>Booked flights</h2>
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
                  {item.schedule.departureLocal.date} at {item.schedule.departureLocal.time}
                </span>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}
