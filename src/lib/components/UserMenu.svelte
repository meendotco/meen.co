<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { LogOut, User } from 'lucide-svelte';

	import { Button } from '@/components/ui/button';
	import { page } from '$app/state';

	let { user } = $props();
</script>

{#if user?.email}
	<DropdownMenuPrimitive.Root>
		<DropdownMenuPrimitive.Trigger>
			<Button
				variant="ghost"
				size="icon"
				class="avatar-button transition-all duration-200 hover:bg-white/5"
			>
				<div class="avatar">
					<User class="avatar-icon" strokeWidth={1.5} />
				</div>
			</Button>
		</DropdownMenuPrimitive.Trigger>

		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content class="dropdown-content" sideOffset={8}>
				<div class="px-3 py-2">
					<p class="text-base font-medium text-white">My Profile</p>
				</div>
				<DropdownMenuPrimitive.Separator class="separator" />
				<div class="px-3 py-2">
					<p class="truncate text-sm text-neutral-400">{user?.email || 'No email'}</p>
				</div>
				<DropdownMenuPrimitive.Separator class="separator" />
				<DropdownMenuPrimitive.Item
					onclick={() => signOut({ redirectTo: page.url.pathname })}
					class="menu-item text-red-500"
				>
					<LogOut class="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuPrimitive.Item>
			</DropdownMenuPrimitive.Content>
		</DropdownMenuPrimitive.Portal>
	</DropdownMenuPrimitive.Root>
{/if}

<style>
	.avatar-button {
		@apply h-10 w-10 rounded-full;
	}

	.avatar {
		@apply flex h-10 w-10 items-center justify-center rounded-full bg-white/5;
	}

	.avatar-icon {
		@apply h-5 w-5 stroke-white/80;
	}

	:global(.dropdown-content) {
		@apply w-64 rounded-xl border border-white/10 bg-black/95 shadow-2xl backdrop-blur-xl;
		animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
		transform-origin: var(--radix-dropdown-menu-content-transform-origin);
		z-index: 9999;
	}

	:global(.separator) {
		@apply my-1 h-px bg-white/10;
	}

	:global(.menu-item) {
		@apply flex cursor-default items-center px-3 py-2.5 text-sm outline-none transition-colors duration-200 hover:bg-white/5 active:bg-white/10;
	}

	@keyframes contentShow {
		from {
			opacity: 0;
			transform: translateY(5px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
