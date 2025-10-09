import Button from "@/components/ui/buttons/Button";
import Image from 'next/image'
import { MenuContent } from "./components/MenuContent";
import { WordCarousel } from "./components/WordCarousel";
import Card from "@/components/ui/cards/Card";
import Input from "@/components/ui/inputs/TextInput";

export const Menu = () => {
	return (
		<section
			className="h-full flex flex-col"
		>
			<MenuContent
				homeView={
					<div
						className="flex-1 flex flex-col items-center justify-center
                                    pb-24 md:pb-28 gap-8 md:gap-8 p-1"
					>
						<Image src={"/logo_white.webp"} alt={"logo"} width={112} height={112} />

						<Button variant="primary" className="py-4 md:py-4 lg:py-4">
							JOUE SANS COMPTE
						</Button>

						<div className="flex flex-col gap-5 items-center">
							<p className="text-center text-shadow-lg font-bold text-sm md:text-base w-[90%] md:w-[60%] lg:w-[50%]">
								Cityborn, c'est le jeu quiz géo-culture où tu découvres où sont nés
								les célébrités en t'amusant, seul ou avec tes potes&nbsp;!
							</p>

							<div className="flex flex-col gap-0 items-center">
								<p className="text-center text-shadow-lg text-shadow-black/40 text-heading font-bold text-sm md:text-xl">
									TROUVE LE LIEU DE NAISSANCE&nbsp;DE
								</p>
								<WordCarousel />
							</div>
						</div>
					</div>
				}
				playView={
					<div className="flex-1 flex flex-col gap-5 items-center justify-center p-4">
						<Card
							size="lg"
							className="w-64 h-28 flex flex-col items-center justify-center p-2"
						>
							<div className="w-full flex flex-col gap-2 justify-center items-center">
								<h2 className="text-base md:text-lg">REJOINDRE</h2>
								<div className="flex flex-row gap-2">
									<Input className="w-full bg-neutral rounded-xl pl-1" placeholder="Code"></Input>
									<Button size="sm">GO</Button>
								</div>
							</div>
						</Card>
						<div
							className="h-full grid gap-3 md:gap-6
                                    grid-cols-1 sm:grid-cols-2
                                    min-h-[40%] lg:max-h-[60%]
                                    transition-all ease-in-out duration-300"
						>
							<div className="h-full flex flex-col items-center justify-center">
								<Card
									size="lg"
									className="h-full w-full flex flex-col max-h-72 min-w-64 md:max-w-90 items-center justify-center"
								>
									<div className="h-full w-full flex flex-col md:flex-row flex-wrap gap-2 justify-center">
										<div className="w-[40%] flex flex-col gap-3 items-center justify-center">
											<h2 className="text-xl md:text-2xl font-bold text-center">SOLO</h2>
										</div>
										<div className="w-full max-w-[60%] h-full flex flex-col gap-3 items-center justify-center px-2">
											<p className="w-full text-[9px] md:text-xs break-normal text-center">
												Joue en solo et prouve que tu es le boss de la culture géo&nbsp;!
											</p>
											<Button className="mt-1" size="md">Créer</Button>
										</div>
									</div>
								</Card>
							</div>

							<div className="h-full flex flex-col items-center justify-center">
								<Card
									size="lg"
									className="h-full w-full flex flex-col max-h-72 min-w-64 md:max-w-90 items-center justify-center"
								>
									<div className="h-full w-full flex flex-col md:flex-row flex-wrap gap-2 justify-center">
										<div className="w-[40%] flex flex-col gap-3 items-center justify-center">
											<h2 className="text-xl md:text-2xl font-bold text-shadow-classic">MULTI</h2>
										</div>
										<div className="w-full max-w-[60%] h-full flex flex-col gap-3 items-center justify-center px-2">
											<p className="w-full text-[9px] md:text-xs break-normal text-center">
												Crée ta partie et défi tes potes&nbsp;!
											</p>
											<Button className="mt-1" size="md">Créer</Button>
										</div>
									</div>
								</Card>
							</div>
						</div>
					</div>
				}
			/>
		</section>
	);
}