"use client"

import { useEffect, useRef } from "react"

import { useAuth } from "@/hooks/useAuth"
import { useClaimInvite } from "@/hooks/useClaimInvite"
import { readInviteRef } from "@/lib/share/inviteCookie"

/** Claims a pending invite cookie once the user is fully set up. */
export function ClaimInviteBootstrap() {
	const { isAuthenticated, isLoading, hasUsername } = useAuth()
	const { claimPendingInvite } = useClaimInvite()
	const ranRef = useRef(false)

	useEffect(() => {
		if (ranRef.current || isLoading || !isAuthenticated || !hasUsername) return
		if (!readInviteRef()) return
		ranRef.current = true
		void claimPendingInvite({ redirect: true })
	}, [isAuthenticated, isLoading, hasUsername, claimPendingInvite])

	return null
}
