// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

//the released version for the troubleshooting questions: the pages job builds the docs from a release tag
const manifest = JSON.parse(readFileSync(new URL('../module/module.json', import.meta.url), 'utf8'));

// https://astro.build/config
export default defineConfig({
	site: 'https://riccisi.gitlab.io',
	base: '/foundryvtt-dice-so-nice',
	outDir: 'public',
	publicDir: 'static',
	vite: {
		define: {
			'import.meta.env.DSN_VERSION': JSON.stringify(manifest.version),
			'import.meta.env.DSN_FOUNDRY': JSON.stringify(String(manifest.compatibility.minimum)),
		},
	},
	integrations: [
		starlight({
			title: 'Dice So Nice!',
			favicon: '/favicon.ico',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/foundryvtt-dice-so-nice/favicon.png' } },
			],
			logo: {
				src: './src/assets/dsn-logo-small.png',
				alt: 'Dice So Nice logo',
			},
			customCss: ['./src/styles/custom.css'],
			components: {
				//adds the footer of the guides: related pages and the way back to their question page
				MarkdownContent: './src/components/QuickGuideContent.astro',
			},
			social: [
				{ icon: 'gitlab', label: 'GitLab', href: 'https://gitlab.com/riccisi/foundryvtt-dice-so-nice' },
			],
			sidebar: [
				{
					label: 'User Guide',
					items: [
						{ label: 'Getting Started', slug: 'guide/getting-started' },
						{ label: 'Appearance', slug: 'guide/appearance' },
						{ label: 'Per-Actor Appearance', slug: 'guide/actor-appearance' },
						{ label: 'Preferences', slug: 'guide/preferences' },
						{ label: 'Special Effects', slug: 'guide/special-effects' },
						{ label: 'Display', slug: 'guide/performance' },
						{ label: 'Profiles & Data', slug: 'guide/save-files' },
						{ label: 'Dice Library', slug: 'guide/dice-library' },
						{ label: 'Dice Editor', slug: 'guide/dice-editor' },
						{ label: 'Custom Dice Terms', slug: 'guide/custom-dice-terms' },
						{ label: 'Persistent Dice', slug: 'guide/persistent-dice' },
						{ label: 'Interactive Throws', slug: 'guide/interactive-throws' },
						{ label: 'Rollable Area', slug: 'guide/rollable-area' },
						{ label: 'Macros', slug: 'guide/macros' },
					],
				},
				{
					label: 'Developer Guide',
					items: [
						{ label: 'Start here', slug: 'api/start', badge: { text: 'New', variant: 'tip' } },
						{
							label: 'Quick guides',
							collapsed: true,
							items: [
								{ label: 'How it works', slug: 'api/quick/how-it-works' },
								{ label: 'Flags and options', slug: 'api/quick/flags-and-options' },
								{ label: 'Show dice for my rolls', collapsed: true, autogenerate: { directory: 'api/quick/rolls' } },
								{ label: 'Make dice look my way', collapsed: true, autogenerate: { directory: 'api/quick/looks' } },
								{ label: 'React to Dice So Nice', collapsed: true, autogenerate: { directory: 'api/quick/react' } },
							],
						},
						{
							label: 'Show dice for my rolls',
							items: [
								{ label: 'Integration', slug: 'api/integration' },
								{ label: 'Roll API', slug: 'api/roll' },
								{ label: 'Companion Messages', slug: 'api/companion-messages' },
								{ label: 'Interactive Throws', slug: 'api/interactive-throws' },
								{ label: 'Roll Area', slug: 'api/roll-area' },
							],
						},
						{
							label: 'Make dice look my way',
							items: [
								{ label: 'Colors & Themes', slug: 'api/customization' },
								{ label: 'Dice Roles', slug: 'api/roles' },
								{ label: 'Custom Terms', slug: 'api/terms' },
								{ label: 'Custom 3D Models', slug: 'api/3d-models' },
								{ label: 'TexturePacker', slug: 'api/texturepacker' },
							],
						},
						{
							label: 'Dice Systems',
							items: [
								{ label: 'Overview', slug: 'api/dice-systems' },
								{ label: 'System Settings', slug: 'api/system-settings' },
								{ label: 'Custom Shaders', slug: 'api/shaders' },
								{ label: 'Special Effects', slug: 'api/sfx' },
								{ label: 'Tags and Emphasis', slug: 'api/dice-presentation', badge: { text: 'GLUniverse', variant: 'note' } },
							],
						},
						{
							label: 'React to Dice So Nice',
							items: [
								{ label: 'Hooks', slug: 'api/hooks' },
								{ label: 'Events', slug: 'api/events' },
							],
						},
						{
							label: 'Examples',
							items: [
								{ label: 'Demos', slug: 'api/demos' },
							],
						},
					],
				},
				{
					label: 'Troubleshooting',
					items: [
						{ label: 'Start here', slug: 'troubleshooting' },
						{ label: 'Update Dice So Nice!', slug: 'troubleshooting/update' },
						{ label: 'For players and GMs', collapsed: true, autogenerate: { directory: 'troubleshooting/user' } },
						{ label: 'For developers', collapsed: true, autogenerate: { directory: 'troubleshooting/dev' } },
						{ label: 'Still stuck?', slug: 'troubleshooting/still-stuck' },
					],
				},
				{ label: 'Add-ons', slug: 'addons' },
			],
		}),
	],
});
