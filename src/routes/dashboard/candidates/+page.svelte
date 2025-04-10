<script lang="ts">
	import { Search } from '@lucide/svelte';

	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Search Candidates</h2>
	</div>

	<div class="grid gap-6">
		<Card>
			<CardHeader>
				<CardTitle>Find Candidates</CardTitle>
				<CardDescription>
					Search for candidates based on skills, experience, or job post
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="flex space-x-2">
					<div class="relative flex-1">
						<Search
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input type="search" placeholder="Search candidates..." class="pl-10" />
					</div>
					<Button>Search</Button>
				</div>
			</CardContent>
		</Card>

		<div class="rounded-lg border bg-card p-8 text-card-foreground">
			<div class="flex flex-col items-center justify-center text-center">
				<div class="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
					<Search class="h-10 w-10 text-muted-foreground" />
				</div>
				<h3 class="mt-6 text-xl font-semibold">No search results</h3>
				<p class="mt-2 max-w-md text-muted-foreground">
					Enter a search query above to find candidates that match your criteria
				</p>
			</div>
		</div>
	</div>
</div>
