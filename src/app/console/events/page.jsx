"use client";

import Image from "next/image";
import Link from "next/link";
import { CarouselDemo } from "@/components/carousel";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import PageTitle from "@/components/page-title";
import {
  registerForEvent,
  unregisterFromEvent,
  fetchEvents,
} from "@/actions/actions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const data = await fetchEvents();
        // Convert MongoDB documents to plain JavaScript objects
        const serializedEvents = JSON.parse(
          JSON.stringify(data || [])
        );
        setEvents(serializedEvents);
        console.log(
          "the logged user id is",
          session?.user.id
        );
        console.log(
          "the serialized events are",
          serializedEvents
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-medium">
          Unable to load events.
          <br /> Please try again later.
        </p>
      </div>
    );
  }

  const handleRegistration = async (eventId) => {
    if (!session) {
      toast.error("Please login to register for events");
      router.push("/login");
      return;
    }

    try {
      const userId = session.user.id;
      await registerForEvent(eventId, userId);
      toast.success("Successfully registered for event!");

      // Update the events list to reflect the new registration
      setEvents(
        events.map((event) => {
          if (event._id === eventId) {
            return {
              ...event,
              registeredUsers: [
                ...event.registeredUsers,
                userId,
              ],
            };
          }
          return event;
        })
      );
    } catch (error) {
      toast.error(
        error.message || "Failed to register for event"
      );
    }
  };

  const handleUnregister = async (eventId) => {
    if (!session) return;

    try {
      const userId = session.user.id;
      await unregisterFromEvent(eventId, userId);
      toast.success("Successfully unregistered from event");

      // Update the events list to reflect the unregistration
      setEvents(
        events.map((event) => {
          if (event._id === eventId) {
            return {
              ...event,
              registeredUsers: event.registeredUsers.filter(
                (id) => id !== userId
              ),
            };
          }
          return event;
        })
      );
    } catch (error) {
      toast.error("Failed to unregister from event");
    }
  };

  return (
    <main className="w-full">
      <section className="px-20 w-full">
        {/* Ad Banner Carousel */}
        <CarouselDemo />
      </section>
      <main className="p-6 md:p-10">
        <PageTitle title="Events" />
        {loading ? (
          <section className="p-6 md:p-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 20 }).map(
                (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-[300px] w-full"
                  />
                )
              )}
            </div>
          </section>
        ) : (
          <section className="mt-3">
            {events.length === 0 ? (
              <p>No events found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {events.map((event) => (
                  <Link
                    href={`/console/events/${event._id}`}
                    key={event._id}
                  >
                    <Card className="h-full flex flex-col">
                      <CardHeader>
                        <Image
                          src={event.image}
                          alt={event.title}
                          width={300}
                          height={200}
                          className="w-full object-cover rounded-md"
                        />
                      </CardHeader>
                      <div className="flex h-full flex-col justify-between">
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <CardTitle>
                                {event.title}
                              </CardTitle>
                            </div>
                            <p className="text-sm">
                              {event.desc}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          {session?.user.id ===
                          event.creator ? (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/console/events/edit/${event._id}`
                                  )
                                }
                              >
                                Edit Event
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                const isRegistered =
                                  event.registeredUsers?.some(
                                    (user) =>
                                      user._id ===
                                      session?.user.id
                                  );
                                if (isRegistered) {
                                  handleUnregister(
                                    event._id
                                  );
                                } else {
                                  handleRegistration(
                                    event._id
                                  );
                                }
                              }}
                              className="w-full"
                              variant={
                                event.register_status
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {event.register_status
                                ? "Unregister"
                                : "Register"}
                            </Button>
                          )}
                        </CardFooter>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </main>
  );
}
