'use server';

import { auth } from '@/auth/auth';
import { databaseClient } from '@/db/client';
import { user } from '@/db/schema/users/users';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function updateUserInfo(
    redirectTarget: string | undefined,
    formdata: FormData
) {
    'use server';

    const session = await auth();
    await databaseClient
        .update(user)
        .set({
            firstName: (formdata.get('firstname') as string) ?? null,
            lastName: (formdata.get('lastname') as string) ?? null,
            phoneNumber: (formdata.get('phone') as string) ?? null,
        })
        .where(eq(user.email, session?.user?.email!));

    if (redirectTarget) {
        return redirect(redirectTarget);
    } else {
        return redirect('/home');
    }
}
