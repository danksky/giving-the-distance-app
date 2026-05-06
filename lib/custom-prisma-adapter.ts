import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"
import { getStoredCallbackScope, normalizeScopeString } from "@/lib/strava-scope"

/**
 * Custom Prisma Adapter that upserts OAuth accounts so reconnecting an
 * existing Strava account updates tokens instead of failing on duplicates.
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const adapter = PrismaAdapter(prisma)

  return {
    ...adapter,
    async linkAccount(account) {
      console.log('🔗 CustomAdapter linkAccount called with:', JSON.stringify(account, null, 2))
      console.log('🔗 callbackScope from storage:', getStoredCallbackScope())
      
      // Strava sometimes returns scope on the callback URL but not the token response.
      const scopeToSave =
        normalizeScopeString(account.scope) ?? getStoredCallbackScope()
      
      // Use upsert to handle both new accounts and re-authorization
      // This is critical: when a user deauthorizes and re-authorizes,
      // we need to update the tokens, not fail on duplicate key
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        create: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: typeof account.access_token === 'string' ? account.access_token : null,
          refresh_token: typeof account.refresh_token === 'string' ? account.refresh_token : null,
          expires_at: typeof account.expires_at === 'number' ? account.expires_at : null,
          token_type: typeof account.token_type === 'string' ? account.token_type : null,
          scope: scopeToSave ?? null,
          id_token: typeof account.id_token === 'string' ? account.id_token : null,
          session_state: typeof account.session_state === 'string' ? account.session_state : null,
        },
        update: {
          // Update all token-related fields on re-authorization
          access_token: typeof account.access_token === 'string' ? account.access_token : null,
          refresh_token: typeof account.refresh_token === 'string' ? account.refresh_token : null,
          expires_at: typeof account.expires_at === 'number' ? account.expires_at : null,
          token_type: typeof account.token_type === 'string' ? account.token_type : null,
          scope: scopeToSave ?? null,
          id_token: typeof account.id_token === 'string' ? account.id_token : null,
          session_state: typeof account.session_state === 'string' ? account.session_state : null,
        },
      })
      
      console.log('✅ Account linked/updated with scope:', scopeToSave)

      // Return undefined as expected by the Adapter interface
      return undefined
    },
  }
}
