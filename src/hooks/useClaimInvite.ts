"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useToastContext } from "@/components/shared/ToastProvider"
import { clearInviteRef, readInviteRef } from "@/lib/share/inviteCookie"
import { trpc } from "@/lib/trpc/client"

export function useClaimInvite() {
	const router = useRouter()
	const { showToast } = useToastContext()
	const claim = trpc.friends.claimInvite.useMutation()

	const claimPendingInvite = useCallback(
		async (options?: { redirect?: boolean }) => {
			const username = readInviteRef()
			if (!username) return null

			try {
				const result = await claim.mutateAsync({ username })
				clearInviteRef()

				if (result.status === "requested") {
					showToast(`Friend request sent to @${result.inviterUsername}`, "success")
				} else if (result.status === "accepted") {
					showToast(`You're now friends with @${result.inviterUsername}`, "success")
				} else if (result.status === "pending" || result.status === "already_friends") {
					showToast(`You're connected with @${result.inviterUsername}`, "info")
				}

				if (options?.redirect !== false) {
					if (result.status === "accepted" || result.status === "already_friends") {
						router.replace(`/profile/${result.inviterId}`)
					} else if (result.status === "requested" || result.status === "pending") {
						router.replace("/friends?tab=requests")
					}
				}

				return result
			} catch {
				clearInviteRef()
				return null
			}
		},
		[claim, router, showToast],
	)

	return { claimPendingInvite, isClaiming: claim.isPending }
}
