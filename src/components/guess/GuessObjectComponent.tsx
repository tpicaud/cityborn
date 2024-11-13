import GuessObject from "@/types/GuessObject";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";

export default function GuessObjectComponent({ guessObject }: Readonly<{ guessObject: GuessObject }>) {
  return (
      <Card className="absolute top-0 right-0 m-4 w-[10%] min-w-[6em]">
        <CardMedia
          component="img"
          image={guessObject.image}
          alt="pas de photo"
          className="object-cover"
        />
        <CardContent className="flex flex-col break-words">
          <h2 className="text-center text-xs md:text-sm lg:text-base font-bold">
            {guessObject.name}
          </h2>
        </CardContent>
      </Card>
  );
}
