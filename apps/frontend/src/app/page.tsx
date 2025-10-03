import HomeComponent from '@/components/HomeComponent';
import { Menu } from '@/features/menu/menu';

export default function Home() {
	return (
		<section className="min-h-screen h-full">
			<Menu />
		</section>
	);
}
