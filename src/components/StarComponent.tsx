import StarEntity from "@/entities/StarEntity";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";

export default function StarComponent({ star }: Readonly<{ star: StarEntity }>) {
  return (
    <Card className="absolute top-0 right-0 m-4 w-[10%] min-w-[6em] z-10">
      <CardMedia
        component="img"
        image={star.image}
        alt="pas de photo"
        className="object-cover"
      />
      <CardContent className="flex flex-col break-words">
        <h2 className="text-center text-xs md:text-sm lg:text-base font-bold">
          {star.name}
        </h2>
      </CardContent>
    </Card>
  );
}
