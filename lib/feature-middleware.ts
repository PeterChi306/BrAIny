import { NextRequest, NextResponse } from 'next/server'
import { FeatureGate, FeatureName } from './feature-gates'
import { SubscriptionTier } from '../types/database'

export interface FeatureCheckResult {
  allowed: boolean
  userTier: SubscriptionTier
  feature: FeatureName
  upgradeMessage?: string
  upgradePath?: SubscriptionTier[]
}

/**
 * Middleware to check feature access before processing requests
 */
export async function checkFeatureAccess(
  request: NextRequest,
  feature: FeatureName,
  getUserId: (request: NextRequest) => Promise<string | null>,
  getUserTier: (userId: string) => Promise<SubscriptionTier>
): Promise<FeatureCheckResult> {
  try {
    // Get user ID from request
    const userId = await getUserId(request)
    if (!userId) {
      return {
        allowed: false,
        userTier: 'starter',
        feature,
        upgradeMessage: 'Please sign in to access this feature'
      }
    }

    // Get user tier
    const userTier = await getUserTier(userId)

    // Check feature access
    const canAccess = FeatureGate.canAccess(userTier, feature)

    if (!canAccess) {
      const upgradeMessage = FeatureGate.getUpgradeMessage(feature, userTier)
      const requiredTier = FeatureGate.getRequiredTier(feature)
      const upgradePath = requiredTier ? FeatureGate.getUpgradePath(userTier, requiredTier) : []

      return {
        allowed: false,
        userTier,
        feature,
        upgradeMessage,
        upgradePath
      }
    }

    return {
      allowed: true,
      userTier,
      feature
    }
  } catch (error) {
    console.error('Feature check error:', error)
    return {
      allowed: false,
      userTier: 'starter',
      feature,
      upgradeMessage: 'Unable to verify access. Please try again.'
    }
  }
}

/**
 * Higher-order function to wrap API handlers with feature checks
 */
export function withFeatureGate(
  feature: FeatureName,
  handler: (request: NextRequest, context: { userTier: SubscriptionTier; userId: string }) => Promise<NextResponse>,
  options: {
    getUserId?: (request: NextRequest) => Promise<string | null>
    getUserTier?: (userId: string) => Promise<SubscriptionTier>
    onBlocked?: (result: FeatureCheckResult) => NextResponse
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const {
      getUserId = defaultGetUserId,
      getUserTier = defaultGetUserTier,
      onBlocked = defaultOnBlocked
    } = options

    try {
      // Check feature access
      const checkResult = await checkFeatureAccess(request, feature, getUserId, getUserTier)

      if (!checkResult.allowed) {
        return onBlocked(checkResult)
      }

      // Get user ID for the handler
      const userId = await getUserId(request)
      if (!userId) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }

      // Call the original handler with user context
      return handler(request, {
        userTier: checkResult.userTier,
        userId
      })
    } catch (error) {
      console.error('Feature gate middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Default implementations
 */
async function defaultGetUserId(request: NextRequest): Promise<string | null> {
  // Try to get user ID from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // This would validate JWT token and extract user ID
    // For now, return a placeholder
    return 'user-id-placeholder'
  }

  // Try to get from session cookie
  const sessionId = request.cookies.get('session')?.value
  if (sessionId) {
    // This would validate session and get user ID
    return 'user-id-placeholder'
  }

  return null
}

async function defaultGetUserTier(userId: string): Promise<SubscriptionTier> {
  // This would fetch user tier from database
  // For now, return 'starter' as default
  try {
    // const user = await getUserFromDatabase(userId)
    // return user.subscription?.tier || 'starter'
    return 'starter'
  } catch (error) {
    console.error('Error getting user tier:', error)
    return 'starter'
  }
}

function defaultOnBlocked(result: FeatureCheckResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Feature not available',
      feature: result.feature,
      userTier: result.userTier,
      upgradeMessage: result.upgradeMessage,
      upgradePath: result.upgradePath
    },
    { status: 403 }
  )
}

/**
 * Client-side feature check utility
 */
export function checkClientFeatureAccess(
  userTier: SubscriptionTier,
  feature: FeatureName
): { allowed: boolean; upgradeMessage?: string } {
  const canAccess = FeatureGate.canAccess(userTier, feature)
  
  if (!canAccess) {
    return {
      allowed: false,
      upgradeMessage: FeatureGate.getUpgradeMessage(feature, userTier)
    }
  }

  return { allowed: true }
}

/**
 * React Hook for client-side feature gating
 */
export function useClientFeatureGate(userTier: SubscriptionTier) {
  const canAccess = (feature: FeatureName): boolean => {
    return FeatureGate.canAccess(userTier, feature)
  }

  const getUpgradeMessage = (feature: FeatureName): string => {
    return FeatureGate.getUpgradeMessage(feature, userTier)
  }

  const checkAccess = (feature: FeatureName) => {
    return checkClientFeatureAccess(userTier, feature)
  }

  return {
    canAccess,
    getUpgradeMessage,
    checkAccess
  }
}
