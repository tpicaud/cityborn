import { GuessObjectCandidate } from "@cityborn/types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";

export default function GuessObjectCard({ guessObject }: Readonly<{ guessObject: GuessObjectCandidate | null }>) {
    if (!guessObject) return;

    return (
        <Card className="w-[10%] min-w-[6em] pointer-events-auto">
            <CardMedia
                component="img"
                image={guessObject.image}
                alt="pas de photo"
                className="object-cover m-0 p-0"
            />
            <CardContent
                sx={{
                    '&:last-child': {
                        paddingBottom: 1,
                    },
                    paddingY: 1,
                    paddingX: 2,
                }}
                className="break-words">
                <h2 className="text-center text-xs md:text-sm lg:text-base font-bold pb-1">
                    {guessObject.name}
                </h2>
                <p className="text-center text-xs md:text-sm lg:text-base">{guessObject.short_description}</p>
            </CardContent>
        </Card>
    );
}