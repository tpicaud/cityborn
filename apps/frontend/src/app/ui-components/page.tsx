import Button from "@/components/ui/buttons/Button"

export default function UiComponentsPage() {
    return (
        <section className="min-h-screen h-full">
            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
                <div className="flex flex-row gap-4">
                    <Button variant="primary" size="sm">
                        <p className="font-heading font-bold text-neutral">Jouer</p>
                    </Button>
                    <Button variant="primary" size="md">
                        <p className="font-heading font-bold text-neutral">Jouer</p>
                    </Button>
                    <Button variant="primary" size="lg">
                        <p className="font-heading font-bold text-neutral">Jouer</p>
                    </Button>
                </div>
                <div className="flex flex-row gap-4">
                    <Button variant="secondary" size="sm">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                    <Button variant="secondary" size="md">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                    <Button variant="secondary" size="lg">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                </div>
                <div className="flex flex-row gap-4">
                    <Button variant="accent" size="sm">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                    <Button variant="accent" size="md">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                    <Button variant="accent" size="lg">
                        <p className="font-heading font-bold text-neutral-400">Jouer</p>
                    </Button>
                </div>
            </div>
        </section>
    )
}