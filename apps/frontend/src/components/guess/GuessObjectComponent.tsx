'use client';

import type { GuessObject } from '@cityborn/api';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';

export default function GuessObjectComponent({
  guessObject,
}: Readonly<{ guessObject: GuessObject }>) {
  return (
    <Card className="absolute top-0 right-0 my-14 mx-5 w-[10%] min-w-[6em]">
      <CardMedia
        component="img"
        image={guessObject.image}
        alt="pas de photo"
        className="object-cover"
      />
      <CardContent
        sx={{
          '&:last-child': {
            paddingBottom: 1,
          },
          paddingY: 1,
          paddingX: 2,
        }}
        className="break-words"
      >
        <h2 className="text-center text-xs md:text-sm lg:text-base font-bold pb-1">
          {guessObject.name}
        </h2>
        <p className="text-center text-xs md:text-sm lg:text-base">
          {guessObject.short_description}
        </p>
      </CardContent>
    </Card>
  );
}
