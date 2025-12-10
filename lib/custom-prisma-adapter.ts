import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import type { Adapter } from "next-auth/adapters"

/**
 * Custom Prisma Adapter that ensures the scope field is saved
 * 
 * The default PrismaAdapter doesn't save the scope field from OAuth providers,
 * even if it exists in the schema. This custom adapter overrides the linkAccount
 * method to ensure scope is persisted.
 */
/**
 * Temporary storage for scope from callback URL
 * This is a workaround because NextAuth doesn't pass callback URL params to the account object
 */
let callbackScope: string | null = null

export function setCallbackScope(scope: string) {
  console.log('📝 Storing callback scope:', scope)
  callbackScope = scope
}

export function getStoredCallbackScope(): string | null {
  return callbackScope
}

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const adapter = PrismaAdapter(prisma)

  return {
    ...adapter,
    async linkAccount(account: any) {
      console.log('🔗 CustomAdapter linkAccount called with:', JSON.stringify(account, null, 2))
      console.log('🔗 callbackScope from storage:', callbackScope)
      
      // Use the scope from callback URL if account.scope is missing
      const scopeToSave = account.scope || callbackScope
      
      // Ensure scope is included when creating the account
      const createdAccount = await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: scopeToSave, // Use scope from callback or account
          id_token: account.id_token,
          session_state: account.session_state,
        },
      })
      
      console.log('✅ Account created with scope:', createdAccount.scope)
      
      // Clear the temporary scope storage
      callbackScope = null
      
      return createdAccount
    },
  }
}
