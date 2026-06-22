import { Router, type Response } from "express";
import { db, eventsTable, eventRsvpsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { verifyJwt, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CreateEventBody, ListEventsQueryParams, RsvpEventBody, RsvpEventParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

// GET /events - Query scheduled campus events
router.get("/events", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const queryResult = ListEventsQueryParams.safeParse(req.query);
    if (!queryResult.success) {
       res.status(400).json({ error: "Invalid query parameters" });
       return;
    }

    const { communityId } = queryResult.data;

    const events = await db.select({
      id: eventsTable.id,
      title: eventsTable.title,
      description: eventsTable.description,
      location: eventsTable.location,
      startsAt: eventsTable.startsAt,
      endsAt: eventsTable.endsAt,
      imageUrl: eventsTable.imageUrl,
      communityId: eventsTable.communityId,
      createdBy: eventsTable.createdBy,
      campusDomain: eventsTable.campusDomain,
      createdAt: eventsTable.createdAt,
      rsvpCount: sql<number>`(SELECT COUNT(*) FROM ${eventRsvpsTable} WHERE ${eventRsvpsTable.eventId} = ${eventsTable.id} AND ${eventRsvpsTable.status} = 'attending')`.mapWith(Number),
      rsvpStatus: sql<string | null>`(SELECT ${eventRsvpsTable.status} FROM ${eventRsvpsTable} WHERE ${eventRsvpsTable.eventId} = ${eventsTable.id} AND ${eventRsvpsTable.userId} = ${userId})`
    })
    .from(eventsTable)
    .where(
      and(
        eq(eventsTable.campusDomain, req.user!.campusDomain),
        communityId ? eq(eventsTable.communityId, communityId) : undefined
      )
    );

    res.status(200).json(events);
  } catch (err) {
    logger.error({ err }, "Error in GET /events");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /events - Create a new campus event
router.post("/events", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const bodyResult = CreateEventBody.safeParse(req.body);
    if (!bodyResult.success) {
       res.status(400).json({ error: "Invalid request payload", details: bodyResult.error.format() });
       return;
    }

    const { title, description, location, startsAt, endsAt, imageUrl, communityId } = bodyResult.data;

    const newEvents = await db.insert(eventsTable)
      .values({
        title,
        description,
        location,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        imageUrl,
        communityId,
        createdBy: userId,
        campusDomain: req.user!.campusDomain
      })
      .returning();

    const event = newEvents[0];

    // Auto-RSVP the creator as attending
    await db.insert(eventRsvpsTable)
      .values({
        eventId: event.id,
        userId,
        status: "attending"
      });

    res.status(201).json({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      imageUrl: event.imageUrl,
      communityId: event.communityId,
      createdBy: event.createdBy,
      campusDomain: event.campusDomain,
      createdAt: event.createdAt,
      rsvpCount: 1,
      rsvpStatus: "attending"
    });
  } catch (err) {
    logger.error({ err }, "Error in POST /events");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /events/:id/rsvp - RSVP to a campus event
router.post("/events/:id/rsvp", verifyJwt, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
       res.status(401).json({ error: "Unauthorized" });
       return;
    }

    const paramsResult = RsvpEventParams.safeParse(req.params);
    const bodyResult = RsvpEventBody.safeParse(req.body);

    if (!paramsResult.success || !bodyResult.success) {
       res.status(400).json({ error: "Invalid request parameters" });
       return;
    }

    const { id: eventId } = paramsResult.data;
    const { status } = bodyResult.data; // 'attending' | 'maybe' | 'declined'

    // check if event exists
    const event = await db.select()
      .from(eventsTable)
      .where(eq(eventsTable.id, eventId))
      .limit(1)
      .then(rows => rows[0]);

    if (!event) {
       res.status(404).json({ error: "Event not found" });
       return;
    }

    // Check existing RSVP
    const existing = await db.select()
      .from(eventRsvpsTable)
      .where(and(eq(eventRsvpsTable.eventId, eventId), eq(eventRsvpsTable.userId, userId)))
      .limit(1)
      .then(rows => rows[0]);

    if (existing) {
      await db.update(eventRsvpsTable)
        .set({ status })
        .where(and(eq(eventRsvpsTable.eventId, eventId), eq(eventRsvpsTable.userId, userId)));
    } else {
      await db.insert(eventRsvpsTable)
        .values({
          eventId,
          userId,
          status
        });
    }

    // Return the updated event counts
    const rsvpCount = await db.select({ count: sql<number>`COUNT(*)` })
      .from(eventRsvpsTable)
      .where(and(eq(eventRsvpsTable.eventId, eventId), eq(eventRsvpsTable.status, "attending")))
      .then(rows => Number(rows[0]?.count || 0));

    res.status(200).json({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      imageUrl: event.imageUrl,
      communityId: event.communityId,
      createdBy: event.createdBy,
      campusDomain: event.campusDomain,
      createdAt: event.createdAt,
      rsvpCount,
      rsvpStatus: status
    });
  } catch (err) {
    logger.error({ err }, "Error in POST /events/:id/rsvp");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
