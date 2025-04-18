import {
    deleteEventSchema,
    events as eventsTable,
    getEventLongDescriptionSchema,
    getEventsSchema,
    insertEventSchema,
    updateEventSchema,
} from '@/db/schema/events';
import { publicProcedure, router } from '../trpc';
import { InternalServerError, UnauthorizedError } from '../exceptions';

import { getUserData, UserRoleEnum } from '@/db/schema/users/users';
import { databaseClient } from '@/db/client';
import { and, asc, eq, getTableColumns } from 'drizzle-orm';
import { checkIns } from '@/db/schema/checkIn';

export interface CalendarEvent {
    id: number;
    checkedIn: boolean;
    hasLongDescription: boolean;
    startDate: Date;
    endDate: Date;
    hackathonId: number;
    title: string;
    color: string;
    location: string;
    description?: string | undefined;
    checkInTime?: string | undefined;
}

export const eventsRouter = router({
    createEvent: publicProcedure
        .input(insertEventSchema)
        .mutation(async ({ input }) => {
            const user = await getUserData();

            // Only admin can create events
            if (user?.userRole !== UserRoleEnum.admin) {
                throw new UnauthorizedError({
                    email: user?.email,
                    role: user?.userRole,
                });
            }
            console.log(`Inserting ${JSON.stringify(input)}`);

            const [event] = await databaseClient
                .insert(eventsTable)
                .values({
                    hackathonId: input.hackathonId,
                    title: input.title,
                    startDate: new Date(input.startDate),
                    endDate: new Date(input.endDate),
                    location: input.location,
                    color: input.color,
                    description: input.description,
                    longDescription: input.longDescription,
                })
                .returning();

            // return event;
        }),

    getEvents: publicProcedure
        .input(getEventsSchema)
        .query(async ({ input }) => {
            const user = await getUserData();

            if (user === undefined) {
                throw new InternalServerError(
                    'Unexpected `undefined` userData'
                );
            }

            const { longDescription, ...rest } = getTableColumns(eventsTable);

            const rows = await databaseClient
                .select({
                    checkIn: {
                        userId: checkIns.userId,
                        checkInTime: checkIns.checkInTime,
                    },
                    event: eventsTable,
                })
                .from(eventsTable)
                .leftJoin(
                    checkIns,
                    and(
                        eq(eventsTable.id, checkIns.eventId),
                        eq(checkIns.userId, user.id)
                    )
                )
                .where(eq(eventsTable.hackathonId, input.hackathonId))
                // events with earlier startDate comes first
                // if 2 events have same startDate, then the one with earlier
                // endDate comes first
                .orderBy(asc(eventsTable.startDate), asc(eventsTable.endDate));

            console.log(`Returned rows: ${JSON.stringify(rows)}`);

            const events = rows.map(({ checkIn, event: _event }) => {
                const { longDescription, ...event } = { ..._event };
                return {
                    ...event,
                    checkedIn: checkIn != null,
                    description: event.description ?? undefined,
                    hasLongDescription:
                        longDescription !== undefined &&
                        longDescription !== null &&
                        longDescription.length > 0,
                    checkInTime: checkIn?.checkInTime ?? undefined,
                };
            });

            return events as CalendarEvent[];
        }),

    getEventLongDescription: publicProcedure
        .input(getEventLongDescriptionSchema)
        .query(async ({ input }) => {
            const [event] = await databaseClient
                .select({
                    id: eventsTable.id,
                    longDescription: eventsTable.longDescription,
                })
                .from(eventsTable)
                .where(eq(eventsTable.id, input.eventId))
                .limit(1);

            return event ?? {};
        }),

    updateEvent: publicProcedure
        .input(updateEventSchema)
        .mutation(async ({ input }) => {
            const [event] = await databaseClient
                .update(eventsTable)
                .set({
                    title: input.title,
                    color: input.color,
                    startDate: new Date(input.startDate),
                    endDate: new Date(input.endDate),
                    location: input.location,
                    description: input.description,
                    longDescription: input.longDescription,
                })
                .where(eq(eventsTable.id, input.eventId))
                .returning();

            return event;
        }),

    deleteEvent: publicProcedure
        .input(deleteEventSchema)
        .mutation(async ({ input }) => {
            return await databaseClient
                .delete(eventsTable)
                .where(eq(eventsTable.id, input.eventId));
        }),
});
