<script lang="ts">
	import { Button } from '@/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Textarea } from '@/components/ui/textarea';
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-3xl font-bold tracking-tight">Create Job Post</h2>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Job Details</CardTitle>
			<CardDescription>Enter the details for your new job posting</CardDescription>
		</CardHeader>
		<CardContent>
			<form class="space-y-6">
				<div class="space-y-2">
					<Label for="title">Job Title</Label>
					<Input id="title" placeholder="e.g., Senior Software Engineer" />
				</div>
				<div class="space-y-2">
					<Label for="company">Company</Label>
					<Input id="company" placeholder="Company name" />
				</div>
				<div class="space-y-2">
					<Label for="location">Location</Label>
					<Input id="location" placeholder="e.g., New York, NY or Remote" />
				</div>
				<div class="space-y-2">
					<Label for="description">Job Description</Label>
					<Textarea id="description" placeholder="Enter the job description" class="min-h-32" />
				</div>
				<div class="space-y-2">
					<Label for="requirements">Requirements</Label>
					<Textarea id="requirements" placeholder="Enter job requirements" class="min-h-32" />
				</div>
				<Button type="submit" class="w-full">Create Job Post</Button>
			</form>
		</CardContent>
	</Card>
</div>
