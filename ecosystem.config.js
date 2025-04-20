module.exports = {
	apps: [
		{
			name: 'web',
			script: 'pnpm',
			args: 'run prod',
			max_memory_restart: '4000M',
			env: {
				NODE_ENV: 'production'
			}
		}
	]
};
